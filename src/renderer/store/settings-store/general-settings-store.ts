import { type LanguageVarious, ThemeMode } from "@shared/types/settings";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const SETTINGS_STORAGE_KEY = "app-settings";

interface SettingsStore {
  theme: ThemeMode;
  language: string;

  setTheme: (newTheme: ThemeMode) => void;
  setLanguage: (newLanguage: string) => void;
}

const { configService } = window.service;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    immer((set) => ({
      theme: ThemeMode.System,
      language: navigator.language || "en",

      setTheme: (newTheme: ThemeMode) => {
        set({ theme: newTheme });

        if (newTheme !== ThemeMode.System) {
          configService.setTheme(newTheme);

          if (newTheme === ThemeMode.Dark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          const actualTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? ThemeMode.Dark
            : ThemeMode.Light;

          configService.setTheme(actualTheme);

          if (actualTheme === ThemeMode.Dark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },

      setLanguage: (newLanguage: string) => {
        set({ language: newLanguage });
        configService.setLanguage(newLanguage as LanguageVarious);
      },
    })),
    {
      name: SETTINGS_STORAGE_KEY,
    },
  ),
);
