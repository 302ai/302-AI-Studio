import { triplitClient } from "@main/triplit/client";
import type { SearchService, Settings } from "@shared/triplit/types";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";
export interface WebSearchConfig {
  enabled: boolean;
  service?: SearchService;
}
@injectable()
export class SettingsDbService extends BaseDbService {
  private settingsRecord: Settings | null = null;

  constructor() {
    super("settings");
    this.initSettingsDbService();
  }

  private async initSettingsDbService() {
    const query = triplitClient.query("settings");
    const settings = await triplitClient.fetch(query);

    this.settingsRecord =
      settings.length === 0 ? await this.initDB() : settings[0];
    if (settings.length === 0) {
      await this.migrateDB();
    }
    await this.resetWebSearchAndReason();
  }

  private async initDB() {
    return await triplitClient.insert("settings", {
      enableWebSearch: false,
      enableReason: false,
      searchService: "search1api",
      theme: "system",
      language: "zh",
      selectedModelId: "",
    });
  }

  private async migrateDB() {
    const query = triplitClient.query("settings");
    const settings = await triplitClient.fetchOne(query);

    if (settings) {
      await triplitClient.update("settings", settings.id, async (setting) => {
        if (!setting.theme) setting.theme = "system";

        if (!setting.language) setting.language = "zh";

        if (!setting.selectedModelId) setting.selectedModelId = "";
      });
    }
  }

  private async resetWebSearchAndReason() {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.enableWebSearch = false;
        setting.enableReason = false;
      },
    );
  }

  async setEnableWebSearch(enable: boolean) {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.enableWebSearch = enable;
      },
    );
  }

  async setEnableReason(enable: boolean) {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.enableReason = enable;
      },
    );
  }

  async setSearchService(searchService: SearchService) {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.searchService = searchService;
      },
    );
  }

  async getEnableReason(): Promise<boolean> {
    const query = triplitClient.query("settings");
    const settings = await triplitClient.fetch(query);
    return settings[0].enableReason;
  }

  async getWebSearchConfig(): Promise<WebSearchConfig> {
    const query = triplitClient.query("settings");
    const settings = await triplitClient.fetch(query);
    return {
      enabled: settings[0].enableWebSearch,
      service: settings[0].searchService,
    };
  }

  async setTheme(theme: "light" | "dark" | "system") {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.theme = theme;
      },
    );
  }

  async getLanguage(): Promise<"zh" | "en" | "ja"> {
    const query = triplitClient.query("settings");
    const settings = await triplitClient.fetchOne(query);
    return (settings?.language as "zh" | "en" | "ja") ?? "zh";
  }

  async setLanguage(language: "zh" | "en" | "ja") {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.language = language;
      },
    );
  }

  async setSelectedModelId(modelId: string) {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.selectedModelId = modelId || "";
      },
    );
  }
}
