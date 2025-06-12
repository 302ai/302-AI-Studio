import { triplitClient } from "@main/triplit/client";
import type {
  CreateThreadData,
  Thread,
  UpdateThreadData,
} from "@shared/triplit/types";

export class ThreadDbService {
  constructor() {
    triplitClient.connect();
  }

  async insertThread(thread: CreateThreadData): Promise<Thread> {
    return await triplitClient.insert("threads", thread);
  }

  async deleteThread(threadId: string) {
    await triplitClient.delete("threads", threadId);
  }

  async updateThread(threadId: string, updateData: UpdateThreadData) {
    const existingThread = await this.getThreadById(threadId);
    if (!existingThread) {
      console.warn(`Thread with id ${threadId} not found, skipping update`);
      return;
    }

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
}
