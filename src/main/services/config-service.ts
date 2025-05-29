import fs from "node:fs";
import path from "node:path";
import type { Model } from "@shared/types/model";
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
import { EventNames, emitter } from "./event-service";
import { WindowService } from "./window-service";

interface IModelStore {
  models: Model[];
  custom_models: Model[];
}

export interface ModelSettingData {
  modelProviders: ModelProvider[];
  providerModelMap: Record<string, Model[]>;
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

  constructor() {
    this.windowService = new WindowService();
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

  getProviders(): ModelProvider[] {
    return this.configStore.get(ConfigKeys.Providers, []) as ModelProvider[];
  }

  updateProvider(updatedProvider: ModelProvider): void {
    const providers = this.getProviders();
    const index = providers.findIndex((p) => p.id === updatedProvider.id);

    if (index !== -1) {
      providers[index] = updatedProvider;
      this.configStore.set(ConfigKeys.Providers, providers);
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setProviders(_event: Electron.IpcMainEvent, providers: ModelProvider[]) {
    this.configStore.set(ConfigKeys.Providers, providers);
    emitter.emit(EventNames.PROVIDERS_UPDATE, { providers });
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  getModelSettings(_event: Electron.IpcMainEvent): ModelSettingData {
    const providers = this.getProviders();
    const providerModelMap = {};

    for (const provider of providers) {
      const store = this.getProviderModelStore(provider.id);
      providerModelMap[provider.id] = store.get("models", []) as Model[];
    }

    const modelSettings = {
      modelProviders: providers,
      providerModelMap,
    };

    return modelSettings;
  }

  private initProviderModelsDir(): void {
    const modelsDir = path.join(this.userDataPath, PROVIDER_MODELS_DIR);
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
  }

  private getProviderModelStore(
    providerId: string
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
      providerId
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
    models: Model[]
  ) {
    this._setProviderModels(providerId, models);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  getProviderModels(
    _event: Electron.IpcMainEvent,
    providerId: string
  ): Model[] {
    Logger.debug("getProviderModels", providerId);
    const store = this.getProviderModelStore(providerId);
    return store.get("models", []) as Model[];
  }
}
