import { TYPES } from "@main/shared/types";
import type {
  CreateModelData,
  CreateProviderData,
  Language,
  Model,
  Provider,
  SearchService,
  Theme,
  UpdateProviderData,
} from "@shared/triplit/types";
import type { ModelProvider } from "@shared/types/provider";
import { nativeTheme } from "electron";
import logger from "@shared/logger/main-logger";
import { inject, injectable } from "inversify";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import type { ConfigDbService } from "./db-service/config-db-service";
import type { SettingsDbService } from "./db-service/settings-db-service";
import { EventNames, sendToMain } from "./event-service";

export interface ModelSettingData {
  modelProviders: ModelProvider[];
  providerModelMap: Record<string, Model[]>;
  providerMap: Record<string, ModelProvider>;
}

@injectable()
@ServiceRegister(TYPES.ConfigService)
export class ConfigService {
  constructor(
    @inject(TYPES.ConfigDbService) private configDbService: ConfigDbService,
    @inject(TYPES.SettingsDbService)
    private settingsDbService: SettingsDbService,
  ) {}

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getAppLanguage(_event: Electron.IpcMainEvent): Promise<Language> {
    try {
      return this.settingsDbService.getLanguage();
    } catch (error) {
      logger.error("ConfigService:getAppLanguage error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setAppLanguage(_event: Electron.IpcMainEvent, language: Language) {
    try {
      return this.settingsDbService.setLanguage(language);
    } catch (error) {
      logger.error("ConfigService:setAppLanguage error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async setAppTheme(_event: Electron.IpcMainEvent, theme: Theme) {
    try {
      await this.settingsDbService.setTheme(theme);
      nativeTheme.themeSource = theme;
      sendToMain(EventNames.WINDOW_TITLE_BAR_OVERLAY_UPDATE, null);
    } catch (error) {
      logger.error("ConfigService:setAppTheme error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateAppTheme(_event: Electron.IpcMainEvent, theme: Theme) {
    try {
      nativeTheme.themeSource = theme;
      sendToMain(EventNames.WINDOW_TITLE_BAR_OVERLAY_UPDATE, null);
    } catch (error) {
      logger.error("ConfigService:updateAppTheme error", { error });
      throw error;
    }
  }

  async getProviders(): Promise<Provider[]> {
    const providers = await this.configDbService.getProviders();
    return providers;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertProvider(
    _event: Electron.IpcMainEvent,
    provider: CreateProviderData,
  ): Promise<Provider> {
    try {
      const newProvider = await this.configDbService.insertProvider(provider);
      sendToMain(EventNames.PROVIDER_ADD, { provider: newProvider });
      return newProvider;
    } catch (error) {
      logger.error("ConfigService:insertProvider error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteProvider(_event: Electron.IpcMainEvent, providerId: string) {
    try {
      await this.configDbService.deleteProvider(providerId);
      sendToMain(EventNames.PROVIDER_DELETE, { providerId });
    } catch (error) {
      logger.error("ConfigService:deleteProvider error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateProvider(
    _event: Electron.IpcMainEvent,
    providerId: string,
    updateData: UpdateProviderData,
  ) {
    try {
      await this.configDbService.updateProvider(providerId, updateData);
      sendToMain(EventNames.PROVIDER_UPDATE, {
        providerId,
        updateData,
      });
    } catch (error) {
      logger.error("ConfigService:updateProvider error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateProviderOrder(
    _event: Electron.IpcMainEvent,
    providerId: string,
    order: number,
  ) {
    try {
      await this.configDbService.updateProviderOrder(providerId, order);
    } catch (error) {
      logger.error("ConfigService:updateProviderOrder error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async insertModels(
    _event: Electron.IpcMainEvent,
    models: CreateModelData[],
  ): Promise<void> {
    try {
      await this.configDbService.insertModels(models);
    } catch (error) {
      logger.error("ConfigService:insertModels error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateProviderModels(
    _event: Electron.IpcMainEvent,
    providerId: string,
    models: CreateModelData[],
  ): Promise<void> {
    try {
      await this.configDbService.updateProviderModels(providerId, models);
    } catch (error) {
      logger.error("ConfigService:updateModels error", { error });
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
      logger.error("ConfigService:setSearchService error", { error });
      throw error;
    }
  }
}
