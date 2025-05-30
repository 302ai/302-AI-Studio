import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../schema";
import { type InsertThread, type Thread, threads } from "../schema/threads";
import { BaseRepository } from "./base-repository";

type DrizzleDB = BetterSQLite3Database<typeof schema>;

export class ThreadRepository extends BaseRepository<Thread, InsertThread> {
  constructor(db: DrizzleDB) {
    super(db, threads);
  }

  async create(data: InsertThread): Promise<Thread> {
    const now = new Date().toISOString();
    const threadData: InsertThread = {
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      isCollected: data.isCollected ?? false,
    };

    const result = await this.db.insert(threads).values(threadData).returning();

    return result[0];
  }
}
