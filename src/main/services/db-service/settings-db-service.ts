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

    await this.resetWebSearchAndReason();
  }

  private async initDB() {
    return await triplitClient.insert("settings", {
      enableWebSearch: false,
      enableReason: false,
      searchService: "search1api",
    });
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
}
