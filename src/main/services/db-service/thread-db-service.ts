import { triplitClient } from "@main/triplit/client";
import type { CreateThreadData, Thread } from "@shared/triplit/types";

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

  async updateThread(
    threadId: string,
    updateFn: (thread: Thread) => void | Promise<void>,
  ) {
    await triplitClient.update("threads", threadId, async (thread) => {
      await updateFn(thread);
      thread.updatedAt = new Date();
    });
  }

  async getThread(threadId: string): Promise<Thread | null> {
    const query = triplitClient.query("threads").Where("id", "=", threadId);
    const threads = await triplitClient.fetch(query);
    return threads[0] || null;
  }
}
