import { defaultLanguage } from "@main/constant";
import { locales } from "@main/utils/locales";
import type { ModelProvider } from "@renderer/types/providers";
import type { LanguageVarious, ThemeMode } from "@renderer/types/settings";
import { app } from "electron";
import ElectronStore from "electron-store";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import { WindowService } from "./window-service";

enum ConfigKeys {
  Language = "language",
  Theme = "theme",
  Providers = "providers",
}

const electronStore: ElectronStore = new ElectronStore();

@ServiceRegister("configService")
export class ConfigService {
  private windowService: WindowService;

  constructor() {
    this.windowService = new WindowService();
  }

  @ServiceHandler()
  getLanguage(): string {
    const currentLocale = app.getLocale();
    const locale = Object.keys(locales).includes(currentLocale)
      ? currentLocale
      : defaultLanguage;

    return electronStore.get(ConfigKeys.Language, locale) as string;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setLanguage(_event: Electron.IpcMainEvent, language: LanguageVarious) {
    electronStore.set(ConfigKeys.Language, language);
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setTheme(_event: Electron.IpcMainEvent, theme: ThemeMode) {
    electronStore.set(ConfigKeys.Theme, theme);
    this.windowService.setTitleBarOverlay(theme);
  }

  getProviders(): ModelProvider[] {
    return electronStore.get(ConfigKeys.Providers, []) as ModelProvider[];
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  setProviders(_event: Electron.IpcMainEvent, providers: ModelProvider[]) {
    electronStore.set(ConfigKeys.Providers, providers);
  }
}
