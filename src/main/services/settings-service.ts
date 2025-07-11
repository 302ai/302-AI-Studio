import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import logger from "@shared/logger/main-logger";
import type { SearchService } from "@shared/triplit/types";
import { inject, injectable } from "inversify";
import type {
  SettingsDbService,
  WebSearchConfig,
} from "./db-service/settings-db-service";
import { EventNames, emitter } from "./event-service";

@injectable()
@ServiceRegister(TYPES.SettingsService)
export class SettingsService {
  constructor(
    @inject(TYPES.SettingsDbService)
    private settingsDbService: SettingsDbService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    emitter.on(EventNames.PROVIDER_DELETE, () => {
      this.resetSelectedModelId();
    });
  }

  async _setSearchService(searchService: SearchService) {
    try {
      await this.settingsDbService.setSearchService(searchService);
    } catch (error) {
      logger.error("SettingsService:setSearchService error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setEnableWebSearch(_event: Electron.IpcMainEvent, enable: boolean) {
    try {
      await this.settingsDbService.setEnableWebSearch(enable);
    } catch (error) {
      logger.error("SettingsService:setEnableWebSearch error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setEnableReason(_event: Electron.IpcMainEvent, enable: boolean) {
    try {
      await this.settingsDbService.setEnableReason(enable);
    } catch (error) {
      logger.error("SettingsService:setEnableReason error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setSearchService(
    _event: Electron.IpcMainEvent,
    searchService: SearchService,
  ) {
    try {
      await this.settingsDbService.setSearchService(searchService);
    } catch (error) {
      logger.error("SettingsService:setSearchService error", { error });
      throw error;
    }
  }

  async getEnableReason(): Promise<boolean> {
    try {
      return await this.settingsDbService.getEnableReason();
    } catch (error) {
      logger.error("SettingsService:getEnableReason error", { error });
      return false;
    }
  }

  async getWebSearchConfig(): Promise<WebSearchConfig> {
    try {
      return await this.settingsDbService.getWebSearchConfig();
    } catch (error) {
      logger.error("SettingsService:getWebSearchConfig error", { error });
      return { enabled: false, service: "search1api" };
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateSelectedModelId(_event: Electron.IpcMainEvent, modelId: string) {
    try {
      await this.settingsDbService.setSelectedModelId(modelId);
    } catch (error) {
      logger.error("SettingsService:updateSelectedModelId error", { error });
      throw error;
    }
  }

  private async resetSelectedModelId(): Promise<void> {
    try {
      await this.settingsDbService.setSelectedModelId("");
    } catch (error) {
      logger.error("SettingsService:resetSelectedModelId error", { error });
      throw error;
    }
  }

  async getLanguage(): Promise<"zh" | "en" | "ja"> {
    try {
      return await this.settingsDbService.getLanguage();
    } catch (error) {
      logger.error("SettingsService:getLanguage error", { error });
      return "zh";
    }
  }

  async setLanguage(language: "zh" | "en" | "ja"): Promise<void> {
    try {
      await this.settingsDbService.setLanguage(language);
    } catch (error) {
      logger.error("SettingsService:setLanguage error", { error });
      throw error;
    }
  }

  async setTheme(theme: "light" | "dark" | "system"): Promise<void> {
    try {
      await this.settingsDbService.setTheme(theme);
    } catch (error) {
      logger.error("SettingsService:setTheme error", { error });
      throw error;
    }
  }
}
