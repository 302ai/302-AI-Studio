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
      streamSmootherEnabled: true,
      streamSpeed: "normal",
      collapseCodeBlock: false,
      hideReason: false,
      collapseThinkBlock: false,
      disableMarkdown: false,
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

  async setEnableDefaultPrivacyMode(enable: boolean) {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.defaultPrivacyMode = enable;
      },
    );
  }

  async setEnablePrivate(enable: boolean) {
    if (!this.settingsRecord) return;
    await triplitClient.update(
      "settings",
      this.settingsRecord.id,
      async (setting) => {
        setting.isPrivate = enable;
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

  async setDisplayAppStore(displayAppStore: boolean) {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.displayAppStore = displayAppStore;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setDisplayAppStore error", { error });
      throw error;
    }
  }

  // Streaming configuration methods
  async getStreamSmootherEnabled(): Promise<boolean> {
    try {
      const query = triplitClient.query("settings");
      const settings = await triplitClient.fetchOne(query);
      return settings?.streamSmootherEnabled ?? true;
    } catch (error) {
      logger.error("SettingsDbService:getStreamSmootherEnabled error", {
        error,
      });
      return true;
    }
  }

  async setStreamSmootherEnabled(enabled: boolean) {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.streamSmootherEnabled = enabled;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setStreamSmootherEnabled error", {
        error,
      });
      throw error;
    }
  }

  async getStreamSpeed(): Promise<"slow" | "normal" | "fast"> {
    try {
      const query = triplitClient.query("settings");
      const settings = await triplitClient.fetchOne(query);
      return (settings?.streamSpeed as "slow" | "normal" | "fast") ?? "normal";
    } catch (error) {
      logger.error("SettingsDbService:getStreamSpeed error", { error });
      return "normal";
    }
  }

  async setStreamSpeed(speed: "slow" | "normal" | "fast") {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.streamSpeed = speed;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setStreamSpeed error", { error });
      throw error;
    }
  }

  async setCollapseCodeBlock(collapseCodeBlock: boolean) {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.collapseCodeBlock = collapseCodeBlock;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setCollapseCodeBlock error", { error });
      throw error;
    }
  }

  async setHideReason(hideReason: boolean) {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.hideReason = hideReason;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setHideReason error", { error });
      throw error;
    }
  }

  async setCollapseThinkBlock(collapseThinkBlock: boolean) {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.collapseThinkBlock = collapseThinkBlock;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setCollapseThinkBlock error", { error });
      throw error;
    }
  }

  async setDisableMarkdown(disableMarkdown: boolean) {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.disableMarkdown = disableMarkdown;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setDisableMarkdown error", { error });
      throw error;
    }
  }

  // async setNewChatUsesLastChatModel(newChatUsesLastChatModel: boolean) {
  //   if (!this.settingsRecord) return;

  //   try {
  //     await triplitClient.update(
  //       "settings",
  //       this.settingsRecord.id,
  //       async (setting) => {
  //         setting.newChatUsesLastChatModel = newChatUsesLastChatModel;
  //       },
  //     );
  //   } catch (error) {
  //     logger.error("SettingsDbService:setNewChatUsesLastChatModel error", {
  //       error,
  //     });
  //     throw error;
  //   }
  // }

  async setNewChatModelId(newChatModelId: string) {
    if (!this.settingsRecord) return;

    try {
      await triplitClient.update(
        "settings",
        this.settingsRecord.id,
        async (setting) => {
          setting.newChatModelId = newChatModelId;
        },
      );
    } catch (error) {
      logger.error("SettingsDbService:setNewChatModelId error", { error });
      throw error;
    }
  }
}
