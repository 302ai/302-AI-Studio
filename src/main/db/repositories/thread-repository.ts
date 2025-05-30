import type { ThreadItem } from "@shared/types/thread";
import { eq } from "drizzle-orm";
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

  async update(threadId: string, data: Partial<InsertThread>): Promise<Thread> {
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    const result = await this.db
      .update(threads)
      .set(updateData)
      .where(eq(threads.threadId, threadId))
      .returning();

    if (result.length === 0) {
      throw new Error(`Thread with threadId ${threadId} not found`);
    }

    return result[0];
  }

  async delete(threadId: string): Promise<boolean> {
    const result = await this.db
      .delete(threads)
      .where(eq(threads.threadId, threadId));

    return result.changes > 0;
  }

  async getAllThreads(): Promise<ThreadItem[]> {
    const result = await this.getAll();
    return result.map(this.toThreadItem);
  }

  private toThreadItem(dbThread: Thread): ThreadItem {
    const {
      threadId,
      title,
      providerId,
      modelId,
      createdAt,
      updatedAt,
      isCollected,
    } = dbThread;
    return {
      id: threadId,
      title,
      settings: {
        providerId,
        modelId,
      },
      createdAt,
      updatedAt,
      isCollected,
    };
  }
}
