import ElectronStore from "electron-store";
import { type LanguageVarious, ThemeMode } from "@types";
import { app } from "electron";
import { locales } from "@main/utils/locales";
import { defaultLanguage } from "@main/constant";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import { WindowService } from "./window-service";

enum ConfigKeys {
  Language = "language",
  Theme = "theme",
}

const electronStore: ElectronStore = new ElectronStore();

@ServiceRegister("configService")
export class ConfigService {
  private windowService: WindowService;

  constructor() {
    this.windowService = new WindowService();
  }

  @ServiceHandler()
  getLanguage() {
    const currentLocale = app.getLocale();
    const locale = Object.keys(locales).includes(currentLocale)
      ? currentLocale
      : defaultLanguage;

    return electronStore.get(ConfigKeys.Language, locale);
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
}
