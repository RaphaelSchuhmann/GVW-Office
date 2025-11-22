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

class DBService {
  private nano: Nano.ServerScope;

  constructor() {
    const COUCHDB_URL =
      process.env.DB_URL || "http://admin:admin@localhost:5984";
    this.nano = Nano(COUCHDB_URL);
  }

  // GEt a reference to a specific database
  private db(dbName: string): Nano.DocumentScope<DocumentData> {
    return this.nano.db.use(dbName);
  }

  // Create / insert a document
  async create(
    dbName: string,
    doc: DocumentData
  ): Promise<Nano.DocumentInsertResponse> {
    return this.db(dbName).insert(doc);
  }

  // Read / get a document by ID
  async read(dbName: string, id: string): Promise<DocumentData | null> {
    try {
      return await this.db(dbName).get(id);
    } catch (err: any) {
      if (err.statusCode == 404) return null;
      throw err; // TODO: Add logger call, ensure this doesn't crash but returns some error value to be handled
    }
  }

  // Update a document (doc must contain _id and _rev)
  async update(
    dbName: string,
    doc: DocumentData
  ): Promise<Nano.DocumentInsertResponse> {
    if (!doc._id || !doc._rev)
      throw new Error("Document must contain _id and _rev for update");
    return this.db(dbName).insert(doc);
  }

  // Delete a document by id and rev
  async delete(
    dbName: string,
    id: string,
    rev: string
  ): Promise<Nano.DocumentDestroyResponse> {
    return this.db(dbName).destroy(id, rev);
  }

  // List all documents in the database
  async list(dbName: string): Promise<DocumentData[]> {
    const res = await this.db(dbName).list({ include_docs: true });
    return res.rows.map((r) => r.doc!) as DocumentData[];
  }

  // Find documents with a Mango query
  async find(dbName: string, query: Nano.MangoQuery): Promise<DocumentData[]> {
    const res = await this.db(dbName).find(query);
    return res.docs as DocumentData[];
  }
}

export const dbService = new DBService();