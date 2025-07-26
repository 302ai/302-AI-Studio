import { useThemeSetting } from "@renderer/queries";
import type { Theme } from "@shared/triplit/types";
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
  const { data: theme } = useThemeSetting();
  const currentTheme = theme ?? "system";

  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  const setTheme = useCallback(async (theme: Theme) => {
    await configService.setAppTheme(theme);
  }, []);

  useEffect(() => {
    configService.updateAppTheme(currentTheme as Theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const actualTheme =
      currentTheme === "system" ? (mediaQuery.matches ? "dark" : "light") : currentTheme;

    if (actualTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleChange = async (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);

      if (currentTheme === "system") {
        if (e.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [currentTheme]);

  return (
    <ThemeContext value={{ theme: currentTheme as Theme, setTheme, isSystemDark }}>
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
