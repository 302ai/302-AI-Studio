// import { triplitClient } from "@shared/triplit/client";
// import type { Provider, Thread } from "@shared/triplit/types";

// async function ensureUIRecord() {
//   try {
//     const query = triplitClient.query("ui");
//     const ui = await triplitClient.fetch(query);

//     if (ui.length === 0) {
//       await triplitClient.insert("ui", {});
//       const newUi = await triplitClient.fetch(query);
//       return newUi[0];
//     }

//     return ui[0];
//   } catch (error) {
//     console.error("Error ensuring UI record:", error);
//     throw error;
//   }
// }

// export async function updateActiveProviderId(providerId: string) {
//   try {
//     const uiRecord = await ensureUIRecord();
//     await triplitClient.update("ui", uiRecord.id, (ui) => {
//       ui.activeProviderId = providerId || "";
//     });
//   } catch (error) {
//     console.error("Error updating active provider ID:", error);
//   }
// }

// export async function updateActiveThreadId(threadId: string) {
//   try {
//     const uiRecord = await ensureUIRecord();
//     await triplitClient.update("ui", uiRecord.id, (ui) => {
//       ui.activeThreadId = threadId || "";
//     });
//   } catch (error) {
//     console.error("Error updating active thread ID:", error);
//   }
// }

// export async function updateActiveTabId(tabId: string) {
//   try {
//     const uiRecord = await ensureUIRecord();
//     await triplitClient.update("ui", uiRecord.id, (ui) => {
//       ui.activeTabId = tabId;
//     });
//   } catch (error) {
//     console.error("Error updating active tab ID:", error);
//   }
// }

// export async function getActiveProviderId(): Promise<string> {
//   try {
//     const uiRecord = await ensureUIRecord();
//     return uiRecord.activeProviderId || "";
//   } catch (error) {
//     console.error("Error getting active provider ID:", error);
//     return "";
//   }
// }

// export async function getActiveThreadId(): Promise<string> {
//   try {
//     const uiRecord = await ensureUIRecord();
//     return uiRecord.activeThreadId || "";
//   } catch (error) {
//     console.error("Error getting active thread ID:", error);
//     return "";
//   }
// }

// export async function getActiveTabId(): Promise<string> {
//   try {
//     const uiRecord = await ensureUIRecord();
//     return uiRecord.activeTabId || "";
//   } catch (error) {
//     console.error("Error getting active tab ID:", error);
//     return "";
//   }
// }

// export async function getActiveProvider(): Promise<Provider | null> {
//   try {
//     const activeProviderId = await getActiveProviderId();

//     if (!activeProviderId) {
//       return null;
//     }

//     const query = triplitClient
//       .query("providers")
//       .Where("id", "=", activeProviderId);
//     const providers = await triplitClient.fetch(query);

//     return providers[0] || null;
//   } catch (error) {
//     console.error("Error getting active provider:", error);
//     return null;
//   }
// }

// export async function getActiveThread(): Promise<Thread | null> {
//   try {
//     const activeThreadId = await getActiveThreadId();

//     if (!activeThreadId) {
//       return null;
//     }

//     const query = triplitClient
//       .query("threads")
//       .Where("id", "=", activeThreadId);
//     const threads = await triplitClient.fetch(query);

//     return threads[0] || null;
//   } catch (error) {
//     console.error("Error getting active thread:", error);
//     return null;
//   }
// }

// export async function clearActiveProvider() {
//   await updateActiveProviderId("");
// }

// export async function clearActiveThread() {
//   await updateActiveThreadId("");
// }

// export async function clearActiveTab() {
//   await updateActiveTabId("");
// }

// export async function updateActiveTabHistory(tabId: string) {
//   try {
//     const uiRecord = await ensureUIRecord();
//     await triplitClient.update("ui", uiRecord.id, async (ui) => {
//       const historyArray = Array.from(ui.activeTabHistory || []);

//       if (historyArray[historyArray.length - 1] !== tabId) {
//         historyArray.push(tabId);
//       }

//       if (historyArray.length > 30) {
//         historyArray.shift();
//       }

//       ui.activeTabHistory = new Set(historyArray);
//     });
//   } catch (error) {
//     console.error("Error updating active tab history:", error);
//   }
// }

// export async function getActiveTabHistory(): Promise<string[]> {
//   try {
//     const uiRecord = await ensureUIRecord();
//     return Array.from(uiRecord.activeTabHistory || []);
//   } catch (error) {
//     console.error("Error getting active tab history:", error);
//     return [];
//   }
// }

// export async function findNextActiveTabFromHistory(
//   removedTabId: string,
//   availableTabIds: string[],
// ): Promise<string | null> {
//   try {
//     const history = await getActiveTabHistory();

//     // Find the most recent valid tab from history
//     for (let i = history.length - 1; i >= 0; i--) {
//       const tabId = history[i];
//       if (tabId !== removedTabId && availableTabIds.includes(tabId)) {
//         return tabId;
//       }
//     }

//     return null;
//   } catch (error) {
//     console.error("Error finding next active tab from history:", error);
//     return null;
//   }
// }

// export async function removeTabFromHistory(tabId: string) {
//   try {
//     const uiRecord = await ensureUIRecord();
//     console.log("🔄 removeTabFromHistory", tabId);
//     await triplitClient.update("ui", uiRecord.id, (ui) => {
//       const historyArray = Array.from(ui.activeTabHistory || []);
//       const filteredHistory = historyArray.filter((id) => id !== tabId);
//       ui.activeTabHistory = new Set(filteredHistory);
//     });
//     console.log("🔄 removeTabFromHistory", uiRecord.activeTabHistory);
//   } catch (error) {
//     console.error("Error removing tab from history:", error);
//   }
// }

// export async function clearActiveTabHistory() {
//   try {
//     const uiRecord = await ensureUIRecord();
//     await triplitClient.update("ui", uiRecord.id, (ui) => {
//       ui.activeTabHistory = new Set();
//     });
//   } catch (error) {
//     console.error("Error clearing active tab history:", error);
//   }
// }

// export async function clearAllUIState() {
//   try {
//     const uiRecord = await ensureUIRecord();
//     await triplitClient.update("ui", uiRecord.id, (ui) => {
//       ui.activeProviderId = "";
//       ui.activeThreadId = "";
//       ui.activeTabId = "";
//       ui.activeTabHistory = new Set();
//     });
//   } catch (error) {
//     console.error("Error clearing all UI state:", error);
//   }
// }
