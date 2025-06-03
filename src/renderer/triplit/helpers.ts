import { triplitClient } from "./client";
import type { Thread } from "./types";

export async function updateThread(
  id: string,
  updateFn: (thread: Thread) => void | Promise<void>
) {
  return await triplitClient.update("threads", id, async (thread) => {
    await updateFn(thread);
    thread.updatedAt = new Date();
  });
}
