import { triplitClient } from "@main/triplit/client";
import type {
  CreateThreadData,
  Thread,
  UpdateThreadData,
} from "@shared/triplit/types";
import { BaseDbService } from "./base-db-service";

export class ThreadDbService extends BaseDbService {
  constructor() {
    super("threads");
  }

  async insertThread(thread: CreateThreadData): Promise<Thread> {
    return await triplitClient.insert("threads", thread);
  }

  async deleteThread(threadId: string) {
    await triplitClient.delete("threads", threadId);
  }

  async updateThread(threadId: string, updateData: UpdateThreadData) {
    await triplitClient.update("threads", threadId, async (thread) => {
      Object.assign(thread, updateData);
      thread.updatedAt = new Date();
    });
  }

  async getThreadById(threadId: string): Promise<Thread | null> {
    const query = triplitClient.query("threads").Where("id", "=", threadId);
    const threads = await triplitClient.fetch(query);
    return threads[0] || null;
  }

  async deleteAllThreads(): Promise<void> {
    const threadsQuery = triplitClient.query("threads");
    const threads = await triplitClient.fetch(threadsQuery);

    await triplitClient.transact(async (tx) => {
      const deletePromises = threads.map((thread) =>
        tx.delete("threads", thread.id),
      );

      await Promise.all(deletePromises);
    });
  }
}
