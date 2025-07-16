import { triplitClient } from "@renderer/client";
import type { Theme } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isSystemDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const { configService } = window.service;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const settingsQuery = triplitClient.query("settings");
  const { result: settingsResult } = useQueryOne(triplitClient, settingsQuery);
  const theme = settingsResult?.theme ?? "system";

  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  const setTheme = useCallback(async (theme: Theme) => {
    await configService.setAppTheme(theme);
  }, []);

  useEffect(() => {
    configService.updateAppTheme(theme as Theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const actualTheme =
      theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

    if (actualTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleChange = async (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);

      if (theme === "system") {
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
    <ThemeContext value={{ theme: theme as Theme, setTheme, isSystemDark }}>
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
