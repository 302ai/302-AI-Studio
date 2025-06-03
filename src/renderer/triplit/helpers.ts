import { triplitClient } from "./client";
import type { Thread } from "./types";

/**
 * Use this function to update thread (automatically set updatedAt)
 * @param id thread id
 * @param updateFn update function
 */
export async function updateThread(
  id: string,
  updateFn: (thread: Thread) => void | Promise<void>
): Promise<void> {
  await triplitClient.update("threads", id, async (thread) => {
    await updateFn(thread);
    thread.updatedAt = new Date();
  });
}
