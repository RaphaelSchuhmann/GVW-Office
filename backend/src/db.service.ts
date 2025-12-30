import Nano from "nano";
import { logger } from "./logger";

type DocumentData = Record<string, any>;

/**
 * Lightweight CouchDB service wrapper using `nano`.
 *
 * This class provides convenience methods for common operations on named
 * databases (create, read, update, delete, list, find). Method signatures
 * intentionally use a loose `DocumentData` type to allow heterogeneous
 * documents; callers can narrow the types as needed.
 */
class DBService {
    private nano: Nano.ServerScope;

    private DBS: string[] = ["users", "members", "events", "app_settings", "emergency_token"];
    private APP_SETTINGS_DB: string = "app_settings";
    private SETTINGS_DOC_ID: string = "general";

    private DEFAULT_SETTINGS = {
        _id: this.SETTINGS_DOC_ID,
        maxMembers: 10,
    };

    /**
     * Create a new DBService instance.
     * The CouchDB URL is read from `process.env.DATABASE_URL` or falls back to
     * `http://admin:admin@localhost:5984` for local development.
     *
     * @example
     * ```typescript
     * const db = new DBService();
     * await db.init();
     * ```
     */
    constructor() {
        const COUCHDB_URL =
            process.env.DATABASE_URL || "http://admin:admin@localhost:5984";
        console.log(COUCHDB_URL);
        this.nano = Nano(COUCHDB_URL);
    }

    /**
     * Initialize the database connection and verify connectivity.
     * This method should be called after creating a DBService instance
     * to ensure the CouchDB connection is established.
     *
     * @throws {Error} Exits the process if connection fails
     * @example
     * ```typescript
     * const db = new DBService();
     * await db.init(); // Verifies connection to CouchDB
     * ```
     */
    async init(): Promise<void> {
        try {
            const info = await this.nano.info();
            logger.info({ info }, "Connected to Database");
        } catch (err) {
            logger.error("Failed to connect to CouchDB: " + err);
            process.exit(1);
        }
    }

    /**
     * Get a `nano` database scope for the provided database name.
     * This is a private helper method used internally by other operations.
     *
     * @param dbName - Name of the CouchDB database
     * @returns Nano document scope for the specified database
     * @private
     */
    private db(dbName: string): Nano.DocumentScope<DocumentData> {
        return this.nano.db.use(dbName);
    }

    /**
     * Insert a new document into the specified database.
     * CouchDB will automatically generate an `_id` if not provided.
     *
     * @param dbName - Target database name (e.g., "users", "members", "events")
     * @param doc - Document data to insert
     * @returns Promise resolving to nano insert response containing `ok`, `id` and `rev`
     * @throws {Error} If the database operation fails
     * @example
     * ```typescript
     * const response = await dbService.create("users", {
     *   email: "user@example.com",
     *   name: "John Doe",
     *   role: "user"
     * });
     * console.log(response.id); // Generated document ID
     * ```
     */
    async create(
        dbName: string,
        doc: DocumentData
    ): Promise<Nano.DocumentInsertResponse> {
        try {
            return this.db(dbName).insert(doc);
        } catch (err: any) {
            if (err.code === "ECONNREFUSED") logger.error("Database unavailable");
            throw err;
        }
    }

    /**
     * Read a document by ID from the database.
     * Returns null if the document is not found instead of throwing an error.
     *
     * @param dbName - Target database name
     * @param id - Document ID to retrieve
     * @returns Promise resolving to the document data or null if not found
     * @throws {Error} If the database operation fails (except for 404 errors)
     * @example
     * ```typescript
     * const user = await dbService.read("users", "user-123");
     * if (user) {
     *   console.log(user.name);
     * } else {
     *   console.log("User not found");
     * }
     * ```
     */
    async read(dbName: string, id: string): Promise<DocumentData | null> {
        try {
            return await this.db(dbName).get(id);
        } catch (err: any) {
            if (err.code === "ECONNREFUSED") logger.error("Database unavailable");
            if (err.statusCode == 404) return null;
            logger.error(err);
            throw err;
        }
    }

    /**
     * Update an existing document in the database.
     * The provided document must contain both `_id` and `_rev` fields for conflict detection.
     *
     * @param dbName - Target database name
     * @param doc - Document data including required `_id` and `_rev` fields
     * @returns Promise resolving to nano insert response with new revision
     * @throws {Error} If `_id` or `_rev` are missing, or if the database operation fails
     * @example
     * ```typescript
     * const user = await dbService.read("users", "user-123");
     * if (user) {
     *   user.name = "Updated Name";
     *   const response = await dbService.update("users", user);
     *   console.log(response.rev); // New revision
     * }
     * ```
     */
    async update(
        dbName: string,
        doc: DocumentData
    ): Promise<Nano.DocumentInsertResponse> {
        try {
            if (!doc._id || !doc._rev) {
                return Promise.reject(new Error("Document must contain _id and _rev for update"));
            }
            return this.db(dbName).insert(doc);
        } catch (err: any) {
            if (err.code === "ECONNREFUSED") logger.error("Database unavailable");
            logger.error(err);
            throw err;
        }
    }

    /**
     * Delete a document by ID and revision.
     * Both ID and revision are required for conflict detection in CouchDB.
     *
     * @param dbName - Target database name
     * @param id - Document ID to delete
     * @param rev - Document revision to delete (for conflict detection)
     * @returns Promise resolving to nano destroy response
     * @throws {Error} If the document doesn't exist or revision conflicts
     * @example
     * ```typescript
     * const user = await dbService.read("users", "user-123");
     * if (user) {
     *   await dbService.delete("users", user._id, user._rev);
     *   console.log("User deleted");
     * }
     * ```
     */
    async delete(
        dbName: string,
        id: string,
        rev: string
    ): Promise<Nano.DocumentDestroyResponse> {
        try {
            return this.db(dbName).destroy(id, rev);
        } catch (err: any) {
            if (err.code === "ECONNREFUSED") logger.error("Database unavailable");
            logger.error(err);
            throw err;
        }
    }

    /**
     * List all documents in the database and return their document data.
     * This method retrieves all documents including their full content.
     *
     * @param dbName - Target database name
     * @returns Promise resolving to array of all documents in the database
     * @throws {Error} If the database operation fails
     * @example
     * ```typescript
     * const allUsers = await dbService.list("users");
     * console.log(`Found ${allUsers.length} users`);
     * allUsers.forEach(user => console.log(user.name));
     * ```
     */
    async list(dbName: string): Promise<DocumentData[]> {
        try {
            const res = await this.db(dbName).list({ include_docs: true });
            return res.rows.map((r) => r.doc!) as DocumentData[];
        } catch (err: any) {
            if (err.code === "ECONNREFUSED") logger.error("Database unavailable");
            logger.error(err);
            throw err;
        }
    }

    /**
     * Find documents using a Mango query object.
     * Supports complex queries with selectors, sorting, limits, and more.
     *
     * @param dbName - Target database name
     * @param query - Mango query object with selector, limit, sort, etc.
     * @returns Promise resolving to array of documents matching the query
     * @throws {Error} If the database operation fails
     * @example
     * ```typescript
     * // Find events after a specific date
     * const upcomingEvents = await dbService.find("events", {
     *   selector: { date: { $gte: "2025-01-01" } },
     *   sort: [{ date: "asc" }],
     *   limit: 10
     * });
     *
     * // Find users by role
     * const admins = await dbService.find("users", {
     *   selector: { role: "admin" }
     * });
     * ```
     */
    async find(
        dbName: string,
        query: Nano.MangoQuery
    ): Promise<DocumentData[]> {
        try {
            const res = await this.db(dbName).find(query);
            return res.docs as DocumentData[];
        } catch (err: any) {
            if (err.code === "ECONNREFUSED") logger.error("Database unavailable");
            logger.error(err);
            throw err;
        }
    }

    async generateDatabases(): Promise<void> {
        for (const dbName of this.DBS) {
            try {
                await dbService.nano.db.create(dbName);
                logger.info(`Database "${dbName}" created`);
            } catch (err: any) {
                if (err.statusCode === 412) {
                    // Database already exists
                    logger.info(`Database "${dbName}" already exists`);
                } else {
                    logger.error({err}, `Failed to create database "${dbName}"`);
                    throw err;
                }
            }
        }

        // Ensure default settings document exists in app_settings
        try {
            const existingSettings = await dbService.read(this.APP_SETTINGS_DB, this.SETTINGS_DOC_ID);
            if (!existingSettings) {
                await dbService.create(this.APP_SETTINGS_DB, this.DEFAULT_SETTINGS);
                logger.info("Default app settings document created");
            } else {
                logger.info("App settings document already exists");
            }
        } catch (err) {
            logger.error({err}, "Failed to initialize app settings document:");
            throw err;
        }

        logger.info("All databases initialized successfully");
    }
}

export const dbService = new DBService();
