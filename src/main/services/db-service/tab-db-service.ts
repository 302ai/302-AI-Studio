import { triplitClient } from "@main/triplit/client";
import type {
  CreateTabData,
  Tab,
  Ui,
  UpdateTabData,
} from "@shared/triplit/types";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

@injectable()
export class TabDbService extends BaseDbService {
  constructor() {
    super("tabs");
  }

  async insertTab(tab: CreateTabData): Promise<Tab> {
    const query = triplitClient.query("tabs");
    const existingTabs = await triplitClient.fetch(query);
    const maxOrder = existingTabs.reduce(
      (max, t) => Math.max(max, t.order || 0),
      -1,
    );

    return await triplitClient.insert("tabs", {
      ...tab,
      order: maxOrder + 1,
    });
  }

  async deleteTab(tabId: string): Promise<string> {
    // Get all tabs before deletion
    const query = triplitClient.query("tabs").Order("order", "ASC");
    const allTabs = await triplitClient.fetch(query);

    // Get current active tab
    const uiQuery = triplitClient.query("ui");
    const uiRecord = await triplitClient.fetchOne(uiQuery);
    if (!uiRecord) {
      return "";
    }

    const currentActiveTabId = uiRecord?.activeTabId;

    // Delete the tab
    await triplitClient.delete("tabs", tabId);
    await this.removeTabFromHistory(uiRecord, tabId);

    // If we deleted the active tab, find a replacement
    if (currentActiveTabId === tabId) {
      const remainingTabs = allTabs.filter((tab) => tab.id !== tabId);

      if (remainingTabs.length > 0) {
        const remainingTabIds = remainingTabs.map((tab) => tab.id);

        // Try to find next active tab from history
        const nextActiveTabFromHistory =
          await this.findNextActiveTabFromHistory(
            uiRecord,
            tabId,
            remainingTabIds,
          );

        const nextActiveTabId = nextActiveTabFromHistory || remainingTabs[0].id;
        await this.updateActiveTabId(uiRecord, nextActiveTabId);

        await this.reorderTabs();
        return nextActiveTabId;
      } else {
        // No tabs remaining
        await this.updateActiveTabId(uiRecord, "");
        return "";
      }
    }

    await this.reorderTabs();
    return currentActiveTabId || "";
  }

  async updateTab(tabId: string, updateData: UpdateTabData): Promise<void> {
    await triplitClient.update("tabs", tabId, updateData);
    await this.reorderTabs();
  }

  async getTab(tabId: string): Promise<Tab | null> {
    const tab = await triplitClient.fetchById("tabs", tabId);
    return tab || null;
  }

  private async reorderTabs() {
    const query = triplitClient.query("tabs").Order("order", "ASC");
    const tabs = await triplitClient.fetch(query);

    const updatePromises = tabs.map((tab, index) => {
      return triplitClient.update("tabs", tab.id, {
        order: index,
      });
    });

    await Promise.all(updatePromises);
  }

  async moveTab(
    fromIndex: number,
    toIndex: number,
    tabs: Tab[],
  ): Promise<void> {
    try {
      const updatedTabs = [...tabs];
      const [movedTab] = updatedTabs.splice(fromIndex, 1);
      updatedTabs.splice(toIndex, 0, movedTab);

      const updatePromises = updatedTabs.map((tab, index) => {
        return triplitClient.update("tabs", tab.id, {
          order: index,
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Failed to move tab:", error);
      throw error;
    }
  }

  private async findNextActiveTabFromHistory(
    uiRecord: Ui,
    removedTabId: string,
    availableTabIds: string[],
  ): Promise<string | null> {
    const history = await this.getActiveTabHistory(uiRecord);

    // Find the most recent valid tab from history
    for (let i = history.length - 1; i >= 0; i--) {
      const tabId = history[i];
      if (tabId !== removedTabId && availableTabIds.includes(tabId)) {
        return tabId;
      }
    }

    return null;
  }

  private async getActiveTabHistory(uiRecord: Ui): Promise<string[]> {
    return Array.from(uiRecord.activeTabHistory || []);
  }

  private async removeTabFromHistory(uiRecord: Ui, tabId: string) {
    if (!uiRecord) {
      return;
    }

    await triplitClient.update("ui", uiRecord.id, (ui) => {
      const historyArray = Array.from(ui.activeTabHistory || []);
      const filteredHistory = historyArray.filter((id) => id !== tabId);
      ui.activeTabHistory = new Set(filteredHistory);
    });
  }

  private async updateActiveTabId(uiRecord: Ui, tabId: string) {
    if (!uiRecord) {
      return;
    }

    await triplitClient.update("ui", uiRecord.id, (ui) => {
      ui.activeTabId = tabId;
    });
  }
}
