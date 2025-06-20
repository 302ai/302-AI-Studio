import { useSettingsStore } from "@renderer/store/settings-store";
import { ThemeMode } from "@shared/types/settings";
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSystemDark, setIsSystemDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const storedTheme = await configService.getTheme();

        // 如果存储的主题与当前状态不同，更新状态
        if (storedTheme !== theme) {
          setTheme(storedTheme);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize theme:", error);
        setIsInitialized(true);
      }
    };

    initializeTheme();
  }, [setTheme, theme]);

  useEffect(() => {
    if (!isInitialized) return;

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
  }, [theme, isInitialized]);

  // 在初始化完成前不渲染子组件，避免闪烁
  if (!isInitialized) {
    return null;
  }

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
