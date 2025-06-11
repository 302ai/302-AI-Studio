import type { CreateModelData, CreateProviderData, Model, Provider, UpdateProviderData } from "@shared/triplit/types";
import type { ModelProvider } from "@shared/types/provider";
import type { LanguageVarious, ThemeMode } from "@shared/types/settings";
import Logger from "electron-log";
import ElectronStore from "electron-store";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import { ConfigDbService } from "./db-service/config-db-service";
import { EventNames, emitter } from "./event-service";
import { WindowService } from "./window-service";

export interface ModelSettingData {
  modelProviders: ModelProvider[];
  providerModelMap: Record<string, Model[]>;
  providerMap: Record<string, ModelProvider>;
}

enum ConfigKeys {
  Language = "language",
  Theme = "theme",
  Providers = "providers",
}

@ServiceRegister("configService")
export class ConfigService {
  private configStore: ElectronStore = new ElectronStore();
  private windowService: WindowService;
  private configDbService: ConfigDbService;

  constructor() {
    this.windowService = new WindowService();
    this.configDbService = new ConfigDbService();
  }

  @ServiceHandler()
  getLanguage(_event: Electron.IpcMainEvent): string {
    return this.configStore.get(ConfigKeys.Language, "zh-CN") as string;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setLanguage(_event: Electron.IpcMainEvent, language: LanguageVarious) {
    this.configStore.set(ConfigKeys.Language, language);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setTheme(_event: Electron.IpcMainEvent, theme: ThemeMode) {
    this.configStore.set(ConfigKeys.Theme, theme);
    this.windowService.setTitleBarOverlay(theme);
  }

  async getProviders(): Promise<Provider[]> {
    const providers = await this.configDbService.getProviders();
    return providers;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertProvider(_event: Electron.IpcMainEvent, provider: CreateProviderData): Promise<Provider> {
    try {
      const newProvider = await this.configDbService.insertProvider(provider);
      emitter.emit(EventNames.PROVIDER_ADD, { provider: newProvider });
      Logger.info("addProvider success ---->", newProvider);
      return newProvider;
    } catch (error) {
      Logger.error("addProvider error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteProvider(_event: Electron.IpcMainEvent, providerId: string) {
    try {
      await this.configDbService.deleteProvider(providerId);
      emitter.emit(EventNames.PROVIDER_DELETE, { providerId });
      Logger.info("deleteProvider success ---->", providerId);
    } catch (error) {
      Logger.error("deleteProvider error ---->", error);
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
      Logger.info("updateProvider success ---->", providerId);
    } catch (error) {
      Logger.error("updateProvider error ---->", error);
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async insertModels(_event: Electron.IpcMainEvent, models: CreateModelData[]): Promise<void> {
    try {
      await this.configDbService.insertModels(models);
      Logger.info("addModels success");
    } catch (error) {
      Logger.error("addModels error ---->", error);
      throw error;
    }
  }
}
