import { useSettingsStore } from "@renderer/store/settings-store";
import { ThemeMode } from "@renderer/types/settings";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isSystemDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const { configService } = window.service;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useSettingsStore();
  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const actualTheme =
      theme === ThemeMode.System
        ? mediaQuery.matches
          ? ThemeMode.Dark
          : ThemeMode.Light
        : theme;

    if (actualTheme === ThemeMode.Dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
      if (theme === ThemeMode.System) {
        const actualTheme = e.matches ? ThemeMode.Dark : ThemeMode.Light;

        configService.setTheme(actualTheme);

        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext value={{ theme, setTheme, isSystemDark }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
