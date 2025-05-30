/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../schema";

type DrizzleDB = BetterSQLite3Database<typeof schema>;

export class BaseRepository<
  T extends { id: number | string },
  U extends Record<string, any>
> {
  protected db: DrizzleDB;
  protected table: any;

  constructor(db: DrizzleDB, table: any) {
    this.db = db;
    this.table = table;
  }

  async getAll(): Promise<T[]> {
    return this.db.select().from(this.table);
  }

  async getById(id: string): Promise<T | undefined> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    return result[0] as T | undefined;
  }

  async create(data: U): Promise<T> {
    const result = await this.db.insert(this.table).values(data).returning();

    return result[0] as T;
  }

  async update(id: string, data: Partial<U>): Promise<T> {
    const result = await this.db
      .update(this.table)
      .set(data)
      .where(eq(this.table.id, id))
      .returning();

    return result[0] as T;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id));

    return result.changes > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    return result.length > 0;
  }
}
