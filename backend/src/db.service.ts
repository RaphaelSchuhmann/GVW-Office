import Nano from "nano";

type DocumentData = Record<string, any>;

/* Example usage:
import { dbService } from "./db.service";

Users
await dbService.create("users", { email: "foo@bar.com", name: "Foo", role: "user", passwordHash: "..." });
const user = await dbService.read("users", "some-user-id");
const allUsers = await dbService.list("users");

Members
await dbService.create("members", { name: "Max Mustermann", voice: "tenor" });
const members = await dbService.list("members");

Events
await dbService.create("events", { title: "Jahreshauptversammlung", date: "2025-12-20" });
const events = await dbService.find("events", { selector: { date: { $gte: "2025-01-01" } } });

Sheet music
await dbService.create("sheetmusic", { title: "Ave Verum", composer: "Mozart" }); 
*/

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

    /**
     * Create a new DBService instance.
     * The CouchDB URL is read from `process.env.DB_URL` or falls back to
     * `http://admin:admin@localhost:5984` for local development.
     */
    constructor() {
        const COUCHDB_URL =
            process.env.DB_URL || "http://localhost:5985"; // Add 
        console.log(COUCHDB_URL);
        this.nano = Nano(COUCHDB_URL);
    }

    /**
     * Get a `nano` database scope for the provided database name.
     * @param dbName - name of the CouchDB database
     */
    private db(dbName: string): Nano.DocumentScope<DocumentData> {
        return this.nano.db.use(dbName);
    }

    /**
     * Insert a new document into the specified database.
     * @param dbName - target database name
     * @param doc - document to insert
     * @returns nano insert response containing `ok`, `id` and `rev`
     */
    async create(
        dbName: string,
        doc: DocumentData
    ): Promise<Nano.DocumentInsertResponse> {
        return this.db(dbName).insert(doc);
    }

    /**
     * Read a document by id from the database.
     * @param dbName - target database name
     * @param id - document id
     * @returns the document or `null` when not found
     */
    async read(dbName: string, id: string): Promise<DocumentData | null> {
        try {
            return await this.db(dbName).get(id);
        } catch (err: any) {
            if (err.statusCode == 404) return null;
            throw err; // TODO: add logger call and structured error handling
        }
    }

    /**
     * Update a document. The provided `doc` must contain `_id` and `_rev`.
     * @param dbName - target database name
     * @param doc - document including `_id` and `_rev`
     */
    async update(
        dbName: string,
        doc: DocumentData
    ): Promise<Nano.DocumentInsertResponse> {
        if (!doc._id || !doc._rev)
            throw new Error("Document must contain _id and _rev for update");
        return this.db(dbName).insert(doc);
    }

    /**
     * Delete a document by id and revision.
     * @param dbName - target database name
     * @param id - document id
     * @param rev - document revision to delete
     */
    async delete(
        dbName: string,
        id: string,
        rev: string
    ): Promise<Nano.DocumentDestroyResponse> {
        return this.db(dbName).destroy(id, rev);
    }

    /**
     * List all documents in the database and return their `doc` fields.
     * @param dbName - target database name
     * @returns array of documents
     */
    async list(dbName: string): Promise<DocumentData[]> {
        const res = await this.db(dbName).list({ include_docs: true });
        return res.rows.map((r) => r.doc!) as DocumentData[];
    }

    /**
     * Find documents using a Mango query object.
     * @param dbName - target database name
     * @param query - Mango query (selector, limit, etc.)
     * @returns array of matching documents
     */
    async find(
        dbName: string,
        query: Nano.MangoQuery
    ): Promise<DocumentData[]> {
        const res = await this.db(dbName).find(query);
        return res.docs as DocumentData[];
    }
}

export const dbService = new DBService();
