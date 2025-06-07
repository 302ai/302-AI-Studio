import fs from "node:fs";
import path from "node:path";
import type { Model } from "@shared/triplit/types";
import type { ModelProvider } from "@shared/types/provider";
import type { LanguageVarious, ThemeMode } from "@shared/types/settings";
import { app } from "electron";
import Logger from "electron-log";
import ElectronStore from "electron-store";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import { WindowService } from "./window-service";

interface IModelStore {
  models: Model[];
  custom_models: Model[];
}

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

const PROVIDER_MODELS_DIR = "provider_models";

@ServiceRegister("configService")
export class ConfigService {
  private configStore: ElectronStore = new ElectronStore();
  private providerModelStoreMap: Map<string, ElectronStore<IModelStore>> =
    new Map();
  private windowService: WindowService;
  private userDataPath: string;
  // private configDbService: ConfigDbService;

  constructor() {
    this.windowService = new WindowService();
    // this.configDbService = new ConfigDbService();
    this.userDataPath = app.getPath("userData");
    this.initProviderModelsDir();
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

  // async updateProvider(updatedProvider: Provider): Promise<void> {
  //   const providers = await this.getProviders();
  //   const index = providers.findIndex((p) => p.id === updatedProvider.id);

  //   if (index !== -1) {
  //     providers[index] = updatedProvider;
  //     this.configStore.set(ConfigKeys.Providers, providers);
  //   }
  // }

  private initProviderModelsDir(): void {
    const modelsDir = path.join(this.userDataPath, PROVIDER_MODELS_DIR);
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
  }

  private getProviderModelStore(
    providerId: string,
  ): ElectronStore<IModelStore> {
    if (!this.providerModelStoreMap.has(providerId)) {
      const store = new ElectronStore<IModelStore>({
        name: `models_${providerId}`,
        cwd: path.join(this.userDataPath, PROVIDER_MODELS_DIR),
        defaults: {
          models: [],
          custom_models: [],
        },
      });
      this.providerModelStoreMap.set(providerId, store);
    }

    return this.providerModelStoreMap.get(
      providerId,
    ) as ElectronStore<IModelStore>;
  }

  _setProviderModels(providerId: string, models: Model[]) {
    const store = this.getProviderModelStore(providerId);
    store.set("models", models);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setProviderModels(
    _event: Electron.IpcMainEvent,
    providerId: string,
    models: Model[],
  ) {
    this._setProviderModels(providerId, models);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  getProviderModels(
    _event: Electron.IpcMainEvent,
    providerId: string,
  ): Model[] {
    Logger.debug("getProviderModels", providerId);
    const store = this.getProviderModelStore(providerId);
    return store.get("models", []) as Model[];
  }

  // ***************** Refactor: 使用 triplit 数据库 ***************** //
  // @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  // async addProvider(
  //   _event: Electron.IpcMainEvent,
  //   provider: CreateProviderData,
  // ) {
  //   try {
  //     const newProvider = await this.configDbService.insertProvider(provider);
  //     Logger.info("addProvider success ---->", newProvider);
  //     return newProvider;
  //   } catch (error) {
  //     Logger.error("addProvider error ---->", error);
  //     throw error;
  //   }
  // }

  // @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  // async deleteProvider(
  //   _event: Electron.IpcMainEvent,
  //   providerId: string,
  // ) {
  //   try {
  //     await this.configDbService.deleteProvider(providerId);
  //     Logger.info("deleteProvider success ---->", providerId);
  //   } catch (error) {
  //     Logger.error("deleteProvider error ---->", error);
  //     throw error;
  //   }
  // }

  // async getProviders(): Promise<Provider[]> {
  //   const providers = await this.configDbService.getProviders();
  //   return providers;
  // }

  // @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  // async addModels(_event: Electron.IpcMainEvent, models: CreateModelData[]): Promise<void> {
  //   try {
  //     await this.configDbService.insertModels(models);
  //     Logger.info("addModels success");
  //   } catch (error) {
  //     Logger.error("addModels error ---->", error);
  //     throw error;
  //   }
  // }

  // @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  // async deleteModelsByProviderId(
  //   _event: Electron.IpcMainEvent,
  //   providerId: string,
  // ) {
  //   await this.configDbService.deleteModels(providerId);
  // }

  // @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  // async updateProvider(
  //   _event: Electron.IpcMainEvent,
  //   providerId: string,
  //   provider: UpdateProviderData,
  // ) {
  //   try {
  //     await this.configDbService.updateProvider(providerId, provider);
  //     Logger.info("updateProvider success ---->", providerId);
  //   } catch (error) {
  //     Logger.error("updateProvider error ---->", error);
  //     throw error;
  //   }
  // }
}
