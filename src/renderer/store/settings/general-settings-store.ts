import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThemeMode } from "@renderer/types";

const SETTINGS_STORAGE_KEY = "app-settings";

interface SettingsStore {
  theme: ThemeMode;
  setTheme: (newTheme: ThemeMode) => void;
  language: string;
  setLanguage: (newLanguage: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: ThemeMode.System,
      setTheme: (newTheme: ThemeMode) => {
        set({ theme: newTheme });

        const actualTheme =
          newTheme === ThemeMode.System
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? ThemeMode.Dark
              : ThemeMode.Light
            : newTheme;

        window.api.setTheme(actualTheme);

        if (actualTheme === ThemeMode.Dark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      language: navigator.language || "en",
      setLanguage: (newLanguage: string) => {
        set({ language: newLanguage });
        window.api.setLanguage(newLanguage);
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
