import { triplitClient } from "@main/triplit/client";
import logger from "@shared/logger/main-logger";
import type {
  Language,
  SearchServices,
  Settings,
  Theme,
} from "@shared/triplit/types";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

export interface WebSearchConfig {
  enabled: boolean;
  service?: SearchServices;
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

    if (settings.length === 0) {
      this.settingsRecord = await this.initDB();
    } else {
      this.settingsRecord = settings[0];
      // await this.migrateDB();
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

  // private async migrateDB() {
  //   const query = triplitClient.query("settings");
  //   const settings = await triplitClient.fetchOne(query);

  //   if (settings) {
  //     await triplitClient.update("settings", settings.id, async (setting) => {
  //       if (!setting.selectedModelId) setting.selectedModelId = "";
  //     });
  //   }
  // }

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

  async setSearchService(searchService: SearchServices) {
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

  async setTheme(theme: Theme) {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.theme = theme;
      },
    );
  }

  async getLanguage(): Promise<Language> {
    const query = triplitClient.query("settings");
    const settings = await triplitClient.fetchOne(query);
    return (settings?.language as Language) ?? "zh";
  }

  async setLanguage(language: Language) {
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

  async setAutoUpdate(autoUpdate: boolean) {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.autoUpdate = autoUpdate;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setAutoUpdate error", { error });
      throw error;
    }
  }

  async getAutoUpdate(): Promise<boolean> {
    try {
      const query = triplitClient.query("settings");
      const settings = await triplitClient.fetchOne(query);
      return settings?.autoUpdate ?? true;
    } catch (error) {
      logger.error("SettingsDbService:getAutoUpdate error", { error });
      throw error;
    }
  }

  async getFeedUrl(): Promise<string> {
    try {
      const query = triplitClient.query("settings");
      const settings = await triplitClient.fetchOne(query);
      return (
        settings?.feedUrl ??
        "https://github.com/302ai/302-AI-Studio/releases/latest/download"
      );
    } catch (error) {
      logger.error("SettingsDbService:getFeedUrl error", { error });
      throw error;
    }
  }
}
