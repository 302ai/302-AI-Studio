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

  async createThread(data: InsertThread): Promise<ThreadItem> {
    const now = new Date().toISOString();
    const threadData: InsertThread = {
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      collected: data.collected ?? false,
    };

    const result = await this.db.insert(threads).values(threadData).returning();

    return this.toThreadItem(result[0]);
  }

  async updateThread(
    threadId: string,
    data: Partial<InsertThread>
  ): Promise<ThreadItem> {
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

    return this.toThreadItem(result[0]);
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

  async getByThreadId(threadId: string): Promise<ThreadItem | undefined> {
    const result = await this.db
      .select()
      .from(threads)
      .where(eq(threads.threadId, threadId))
      .limit(1);

    return result[0] ? this.toThreadItem(result[0]) : undefined;
  }

  private toThreadItem(dbThread: Thread): ThreadItem {
    const {
      threadId,
      title,
      providerId,
      modelId,
      createdAt,
      updatedAt,
      collected,
    } = dbThread;
    return {
      id: threadId,
      title,
      providerId,
      modelId,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
      collected: collected,
    };
  }
}
