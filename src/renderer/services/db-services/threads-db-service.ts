import { triplitClient } from "@shared/triplit/client";
import type { CreateThreadData, Thread } from "@shared/triplit/types";

export async function deleteThread(threadId: string) {
  await triplitClient.delete("threads", threadId);
}

export async function insertThread(thread: CreateThreadData): Promise<Thread> {
  return await triplitClient.insert("threads", thread);
}

export async function updateThread(
  id: string,
  updateFn: (thread: Thread) => void | Promise<void>
): Promise<void> {
  await triplitClient.update("threads", id, async (thread) => {
    await updateFn(thread);
    thread.updatedAt = new Date();
  });
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const query = triplitClient.query("threads").Where("id", "=", threadId);
  const threads = await triplitClient.fetch(query);
  return threads[0] || null;
}