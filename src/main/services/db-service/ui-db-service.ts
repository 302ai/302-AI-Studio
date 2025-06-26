import { triplitClient } from "@main/triplit/client";
import type {
  Language,
  Provider,
  SearchService,
  Theme,
  Thread,
  Ui,
} from "@shared/triplit/types";
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
      await this.initDB();
    }
    // else {
    //   this.uiRecord = ui[0];
    //   await this.migrateDB();
    // }
  }

  private async initDB() {
    this.uiRecord = await triplitClient.insert("ui", {
      activeProviderId: "",
      activeThreadId: "",
      activeTabId: "",
      activeTabHistory: new Set(),
      theme: "system",
      language: "zh",
      searchProvider: "search1api",
      enableWebSearch: false,
      enableReason: false,
    });
  }

  // private async migrateDB() {
  //   const query = triplitClient.query("ui");
  //   const ui = await triplitClient.fetchOne(query);

  //   if (ui) {
  //     await triplitClient.update("ui", ui.id, async (ui) => {
  //       if (!ui.theme) ui.theme = "system";

  //       if (!ui.language) ui.language = "zh";

  //       if (!ui.searchProvider) ui.searchProvider = "search1api";

  //       if (!ui.selectedModelId) ui.selectedModelId = "";
  //     });
  //   }
  // }

  async getTheme(): Promise<Theme> {
    const query = triplitClient.query("ui");
    const ui = await triplitClient.fetchOne(query);
    return (ui?.theme as Theme) ?? "system";
  }

  async setTheme(theme: Theme) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      ui.theme = theme;
    });
  }

  async getLanguage(): Promise<Language> {
    const query = triplitClient.query("ui");
    const ui = await triplitClient.fetchOne(query);
    return (ui?.language as Language) ?? "zh";
  }

  async setLanguage(language: Language) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      ui.language = language;
    });
  }

  async setSearchService(searchProvider: SearchService) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      ui.searchProvider = searchProvider;
    });
  }

  // * Active Provider Id
  async updateActiveProviderId(providerId: string) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      ui.activeProviderId = providerId || "";
    });
  }

  async getActiveProviderId(): Promise<string> {
    if (!this.uiRecord) return "";

    return this.uiRecord.activeProviderId || "";
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
    if (!this.uiRecord) return "";

    return this.uiRecord.activeThreadId || "";
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
    if (!this.uiRecord) return "";

    return this.uiRecord.activeTabId || "";
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

  async updateSelectedModelId(modelId: string) {
    if (!this.uiRecord) return;

    await triplitClient.update("ui", this.uiRecord.id, async (ui) => {
      ui.selectedModelId = modelId || "";
    });
  }
}
