import ElectronStore from "electron-store";
import { LanguageVarious, ThemeMode } from "@types";
import { app } from "electron";
import { locales } from "../utils/locales";
import { defaultLanguage } from "../constant";

enum ConfigKeys {
  Language = "language",
  Theme = "theme",
}

export class ConfigService {
  private store: ElectronStore;

  constructor() {
    this.store = new ElectronStore();
  }

  set(key: string, value: unknown) {
    this.store.set(key, value);
  }

  get<T>(key: string, defaultValue?: T) {
    return this.store.get(key, defaultValue) as T;
  }

  getLanguage(): LanguageVarious {
    const currentLocale = app.getLocale();
    const locale = Object.keys(locales).includes(currentLocale)
      ? currentLocale
      : defaultLanguage;

    return this.get<LanguageVarious>(
      ConfigKeys.Language,
      locale as LanguageVarious
    );
  }

  setLanguage(language: LanguageVarious) {
    this.set(ConfigKeys.Language, language);
  }

  getTheme(): ThemeMode {
    return this.get(ConfigKeys.Theme, ThemeMode.Light);
  }

  setTheme(theme: ThemeMode) {
    this.set(ConfigKeys.Theme, theme);
  }
}

export const configManager = new ConfigService();
