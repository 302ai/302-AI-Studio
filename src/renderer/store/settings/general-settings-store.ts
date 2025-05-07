import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { ThemeMode } from "@renderer/types";

const SETTINGS_STORAGE_KEY = "app-settings";

export interface Settings {
  theme: ThemeMode;
  language: string;
}

const defaultSettings: Settings = {
  theme: ThemeMode.System,
  language: navigator.language || "en",
};

export const settingsAtom = atomWithStorage<Settings>(
  SETTINGS_STORAGE_KEY,
  defaultSettings
);

export const actualThemeAtom = atom<ThemeMode.Light | ThemeMode.Dark>((get) => {
  const settings = get(settingsAtom);
  const themePreference = settings.theme;

  if (themePreference === ThemeMode.System) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? ThemeMode.Dark : ThemeMode.Light;
  }

  return themePreference;
});

export const setTheme = atom(null, (_get, set, newTheme: ThemeMode) => {
  set(settingsAtom, (prev) => ({ ...prev, theme: newTheme }));

  const actualTheme =
    newTheme === ThemeMode.System
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? ThemeMode.Dark
        : ThemeMode.Light
      : newTheme;

  if (actualTheme === ThemeMode.Dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
});

export const setLanguage = atom(null, (_get, set, newLanguage: string) => {
  set(settingsAtom, (prev) => ({ ...prev, language: newLanguage }));
});

if (typeof window !== "undefined") {
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  darkModeMediaQuery.addEventListener("change", (e) => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings) as Settings;
        if (settings.theme === ThemeMode.System) {
          if (e.matches) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      }
    } catch (error) {
      console.error("Failed to handle theme change:", error);
    }
  });
}

export const initializeTheme = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings) as Settings;

      if (
        settings.theme === ThemeMode.Dark ||
        (settings.theme === ThemeMode.System &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  } catch (error) {
    console.error("Failed to initialize theme:", error);
  }
};
