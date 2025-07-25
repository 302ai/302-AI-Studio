import { triplitClient } from "@main/triplit/client";
import logger from "@shared/logger/main-logger";
import type { Provider, Thread, Ui } from "@shared/triplit/types";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

@injectable()
export class UiDbService extends BaseDbService {
  private uiRecord: Ui | null = null;

  constructor() {
    super("ui");
    this.initUiDbService();
  }

  private async initUiDbService() {
    const query = triplitClient.query("ui");
    const ui = await triplitClient.fetch(query);

    if (ui.length === 0) {
      this.uiRecord = await this.initDB();
    } else {
      this.uiRecord = ui[0];
      // await this.migrateDB();
    }
  }

  private async initDB() {
    return await triplitClient.insert("ui", {
      activeProviderId: "",
      activeThreadId: "",
      activeTabId: "",
      activeTabHistory: new Set(),
      sidebarCollapsed: false,
    });
  }

  // private async migrateDB() {
  //   const query = triplitClient.query("ui");
  //   const ui = await triplitClient.fetchOne(query);

  //   if (ui) {
  //     await triplitClient.update("ui", ui.id, async (ui) => {
  //       if (!ui.selectedModelId) ui.selectedModelId = "";
  //     });
  //   }
  // }

  // * Active Provider Id
  async updateActiveProviderId(providerId: string) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      ui.activeProviderId = providerId || "";
    });
  }

  async getActiveProviderId(): Promise<string> {
    try {
      const query = triplitClient.query("ui");
      const ui = await triplitClient.fetch(query);
      return ui[0].activeProviderId || "";
    } catch (error) {
      logger.error("UiDbService:getActiveProviderId error", { error });
      throw error;
    }
  }

  async clearActiveProviderId() {
    await this.updateActiveProviderId("");
  }

  // * Active Provider
  async getActiveProvider(): Promise<Provider | null> {
    const activeProviderId = await this.getActiveProviderId();
    if (!activeProviderId) {
      return null;
    }

    const provider = await triplitClient.fetchById(
      "providers",
      activeProviderId,
    );

    return provider || null;
  }

  // * Active Thread Id
  async updateActiveThreadId(threadId: string) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      ui.activeThreadId = threadId || "";
    });
  }

  async getActiveThreadId(): Promise<string> {
    try {
      const query = triplitClient.query("ui");
      const ui = await triplitClient.fetch(query);
      return ui[0].activeThreadId || "";
    } catch (error) {
      logger.error("UiDbService:getActiveThreadId error", { error });
      throw error;
    }
  }

  async clearActiveThreadId() {
    await this.updateActiveThreadId("");
  }

  // * Active Thread
  async getActiveThread(): Promise<Thread | null> {
    const activeThreadId = await this.getActiveThreadId();
    if (!activeThreadId) {
      return null;
    }

    const thread = await triplitClient.fetchById("threads", activeThreadId);

    return thread || null;
  }

  // * Active Tab Id
  async updateActiveTabId(tabId: string) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      ui.activeTabId = tabId || "";
    });
  }

  async getActiveTabId(): Promise<string> {
    try {
      const query = triplitClient.query("ui");
      const ui = await triplitClient.fetch(query);
      return ui[0].activeTabId || "";
    } catch (error) {
      logger.error("UiDbService:getActiveTabId error", { error });
      throw error;
    }
  }

  async clearActiveTabId() {
    await this.updateActiveTabId("");
  }

  // * Tab History
  async updateActiveTabHistory(tabId: string) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      const historyArray = Array.from(ui.activeTabHistory || []);

      if (historyArray[historyArray.length - 1] !== tabId)
        historyArray.push(tabId);

      if (historyArray.length > 30) historyArray.shift();

      ui.activeTabHistory = new Set(historyArray);
    });
  }

  // * Sidebar Collapsed
  async updateSidebarCollapsed(collapsed: boolean) {
    if (!this.uiRecord) return;

    try {
      await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
        ui.sidebarCollapsed = collapsed;
      });
    } catch (error) {
      logger.error("UiDbService:updateSidebarCollapsed error", { error });
      throw error;
    }
  }

  async getSidebarCollapsed(): Promise<boolean> {
    try {
      const query = triplitClient.query("ui");
      const ui = await triplitClient.fetch(query);
      return ui[0].sidebarCollapsed;
    } catch (error) {
      logger.error("UiDbService:getSidebarCollapsed error", { error });
      throw error;
    }
  }
}
