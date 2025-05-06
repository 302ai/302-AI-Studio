import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { ThemeMode } from "@renderer/types";

const THEME_STORAGE_KEY = "app-theme";
const LANGUAGE_STORAGE_KEY = "app-language";

export const themeAtom = atomWithStorage<ThemeMode>(
  THEME_STORAGE_KEY,
  ThemeMode.System
);

export const languageAtom = atomWithStorage<string>(
  LANGUAGE_STORAGE_KEY,
  navigator.language || "en"
);

export const actualThemeAtom = atom<"light" | "dark">((get) => {
  const themePreference = get(themeAtom);

  if (themePreference === ThemeMode.System) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  }

  return themePreference === ThemeMode.Dark ? "dark" : "light";
});

export const setTheme = atom(null, (_get, set, newTheme: ThemeMode) => {
  set(themeAtom, newTheme);

  const actualTheme =
    newTheme === ThemeMode.System
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : newTheme === ThemeMode.Dark
      ? "dark"
      : "light";

  if (actualTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
});

export const setLanguage = atom(null, (_get, set, newLanguage: string) => {
  set(languageAtom, newLanguage);
});

if (typeof window !== "undefined") {
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  darkModeMediaQuery.addEventListener("change", (e) => {
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (currentTheme === `"${ThemeMode.System}"`) {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  });
}

export const initializeTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      const theme = JSON.parse(savedTheme) as ThemeMode;

      if (
        theme === ThemeMode.Dark ||
        (theme === ThemeMode.System &&
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
