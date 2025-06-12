// import { triplitClient } from "@shared/triplit/client";
// import type { CreateTabData, Tab, UpdateTabData } from "@shared/triplit/types";
// import {
//   findNextActiveTabFromHistory,
//   removeTabFromHistory,
//   updateActiveTabId,
// } from "./ui-db-service";

// export async function insertTab(tab: CreateTabData): Promise<Tab> {
//   const query = triplitClient.query("tabs");
//   const existingTabs = await triplitClient.fetch(query);
//   const maxOrder = existingTabs.reduce(
//     (max, t) => Math.max(max, t.order || 0),
//     -1,
//   );

//   return await triplitClient.insert("tabs", {
//     ...tab,
//     order: maxOrder + 1,
//   });
// }

// export async function deleteTab(tabId: string): Promise<string> {
//   try {
//     // Get all tabs before deletion
//     const query = triplitClient.query("tabs").Order("order", "ASC");
//     const allTabs = await triplitClient.fetch(query);

//     // Get current active tab
//     const uiQuery = triplitClient.query("ui");
//     const uiResults = await triplitClient.fetch(uiQuery);
//     const currentActiveTabId = uiResults[0]?.activeTabId;

//     // Delete the tab
//     await triplitClient.delete("tabs", tabId);
//     await removeTabFromHistory(tabId);

//     // If we deleted the active tab, find a replacement
//     if (currentActiveTabId === tabId) {
//       const remainingTabs = allTabs.filter((tab) => tab.id !== tabId);

//       if (remainingTabs.length > 0) {
//         const remainingTabIds = remainingTabs.map((tab) => tab.id);

//         // Try to find next active tab from history
//         const nextActiveTabFromHistory = await findNextActiveTabFromHistory(
//           tabId,
//           remainingTabIds,
//         );

//         const nextActiveTabId = nextActiveTabFromHistory || remainingTabs[0].id;
//         await updateActiveTabId(nextActiveTabId);

//         await reorderTabs();
//         return nextActiveTabId;
//       } else {
//         // No tabs remaining
//         await updateActiveTabId("");
//         return "";
//       }
//     }

//     await reorderTabs();
//     return currentActiveTabId || "";
//   } catch (error) {
//     console.error("Failed to delete tab:", error);
//     throw error;
//   }
// }

// export async function updateTab(
//   tabId: string,
//   updateData: UpdateTabData,
// ): Promise<void> {
//   await triplitClient.update("tabs", tabId, updateData);
//   await reorderTabs();
// }

// export async function getTab(tabId: string): Promise<Tab | null> {
//   const tabQuery = triplitClient.query("tabs").Where("id", "=", tabId);
//   const tab = await triplitClient.fetch(tabQuery);
//   return tab[0] ?? null;
// }

// async function reorderTabs() {
//   const query = triplitClient.query("tabs").Order("order", "ASC");
//   const tabs = await triplitClient.fetch(query);

//   const updatePromises = tabs.map((tab, index) => {
//     return triplitClient.update("tabs", tab.id, {
//       order: index,
//     });
//   });

//   await Promise.all(updatePromises);
// }

// export async function moveTab(
//   fromIndex: number,
//   toIndex: number,
//   tabs: Tab[],
// ): Promise<void> {
//   try {
//     const updatedTabs = [...tabs];
//     const [movedTab] = updatedTabs.splice(fromIndex, 1);
//     updatedTabs.splice(toIndex, 0, movedTab);

//     const updatePromises = updatedTabs.map((tab, index) => {
//       return triplitClient.update("tabs", tab.id, {
//         order: index,
//       });
//     });

//     await Promise.all(updatePromises);
//   } catch (error) {
//     console.error("Failed to move tab:", error);
//     throw error;
//   }
// }
