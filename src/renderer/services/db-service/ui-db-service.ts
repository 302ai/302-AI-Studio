import { triplitClient } from "@shared/triplit/client";
import type { Provider, Thread } from "@shared/triplit/types";

async function ensureUIRecord() {
  try {
    const query = triplitClient.query("ui");
    const ui = await triplitClient.fetch(query);

    if (ui.length === 0) {
      await triplitClient.insert("ui", {});
      const newUi = await triplitClient.fetch(query);
      return newUi[0];
    }

    return ui[0];
  } catch (error) {
    console.error("Error ensuring UI record:", error);
    throw error;
  }
}

export async function updateActiveProviderId(providerId: string) {
  try {
    const uiRecord = await ensureUIRecord();
    await triplitClient.update("ui", uiRecord.id, (ui) => {
      ui.activeProviderId = providerId || "";
    });
  } catch (error) {
    console.error("Error updating active provider ID:", error);
  }
}

export async function updateActiveThreadId(threadId: string) {
  try {
    const uiRecord = await ensureUIRecord();
    await triplitClient.update("ui", uiRecord.id, (ui) => {
      ui.activeThreadId = threadId || "";
    });
  } catch (error) {
    console.error("Error updating active thread ID:", error);
  }
}

export async function getActiveProviderId(): Promise<string> {
  try {
    const uiRecord = await ensureUIRecord();
    return uiRecord.activeProviderId || "";
  } catch (error) {
    console.error("Error getting active provider ID:", error);
    return "";
  }
}

export async function getActiveThreadId(): Promise<string> {
  try {
    const uiRecord = await ensureUIRecord();
    return uiRecord.activeThreadId || "";
  } catch (error) {
    console.error("Error getting active thread ID:", error);
    return "";
  }
}

export async function getActiveProvider(): Promise<Provider | null> {
  try {
    const activeProviderId = await getActiveProviderId();

    if (!activeProviderId) {
      return null;
    }

    const query = triplitClient
      .query("providers")
      .Where("id", "=", activeProviderId);
    const providers = await triplitClient.fetch(query);

    return providers[0] || null;
  } catch (error) {
    console.error("Error getting active provider:", error);
    return null;
  }
}

export async function getActiveThread(): Promise<Thread | null> {
  try {
    const activeThreadId = await getActiveThreadId();

    if (!activeThreadId) {
      return null;
    }

    const query = triplitClient
      .query("threads")
      .Where("id", "=", activeThreadId);
    const threads = await triplitClient.fetch(query);

    return threads[0] || null;
  } catch (error) {
    console.error("Error getting active thread:", error);
    return null;
  }
}

export async function clearActiveProvider() {
  await updateActiveProviderId("");
}

export async function clearActiveThread() {
  await updateActiveThreadId("");
}

export async function clearAllUIState() {
  try {
    const uiRecord = await ensureUIRecord();
    await triplitClient.update("ui", uiRecord.id, (ui) => {
      ui.activeProviderId = "";
      ui.activeThreadId = "";
    });
  } catch (error) {
    console.error("Error clearing all UI state:", error);
  }
}