import { triplitClient } from "@main/triplit/client";
import type {
  CreateThreadData,
  Thread,
  UpdateThreadData,
} from "@shared/triplit/types";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

@injectable()
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

  async updateThread(
    threadId: string,
    updateData?: Omit<UpdateThreadData, "updatedAt">,
    shouldUpdateTimestamp: boolean = true,
  ) {
    await triplitClient.update("threads", threadId, async (thread) => {
      if (updateData) {
        Object.assign(thread, updateData);
      }

      if (shouldUpdateTimestamp) {
        thread.updatedAt = new Date();
      }
    });
  }

  async getThreadById(threadId: string): Promise<Thread | null> {
    return await triplitClient.fetchById("threads", threadId);
  }

  async getThreads(): Promise<Thread[]> {
    const query = triplitClient.query("threads");
    const threads = await triplitClient.fetch(query);
    return threads;
  }

  async deleteAllThreads(): Promise<string[]> {
    const threadsQuery = triplitClient
      .query("threads")
      .Where("collected", "=", false);
    const threads = await triplitClient.fetch(threadsQuery);

    await triplitClient.transact(async (tx) => {
      const deletePromises = threads.map((thread) =>
        tx.delete("threads", thread.id),
      );

      await Promise.all(deletePromises);
    });

    return threads.map((thread) => thread.id);
  }
}
