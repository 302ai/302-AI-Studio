import { triplitClient } from "@renderer/client";
import { cn } from "@renderer/lib/utils";
import type { Theme } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { configService } = window.service;

export function ThemeSwitcher() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.general-settings.theme",
  });

  const settingsQuery = triplitClient.query("settings");
  const { result: settingsResult } = useQueryOne(triplitClient, settingsQuery);
  const theme = settingsResult?.theme ?? "";

  const [thumbStyle, setThumbStyle] = useState({});

  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleThemeChange = async (newTheme: Theme) => {
    await configService.setAppTheme(newTheme);
  };

  const setItemRef = (index: number) => (el: HTMLDivElement | null) => {
    itemsRef.current[index] = el;
  };

  const themeOptions = useMemo(
    () => [
      {
        key: "light",
        icon: <Sun className="size-4" />,
        label: t("light"),
      },
      {
        key: "dark",
        icon: <Moon className="size-4" />,
        label: t("dark"),
      },
      {
        key: "system",
        icon: <Laptop className="size-4" />,
        label: t("system"),
      },
    ],
    [t],
  );

  useEffect(() => {
    const currentIndex = themeOptions.findIndex(
      (option) => option.key === theme,
    );
    if (
      currentIndex === -1 ||
      !itemsRef.current[currentIndex] ||
      !containerRef.current
    ) {
      return;
    }

    const item = itemsRef.current[currentIndex];
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    setThumbStyle({
      left: `${itemRect.left - containerRect.left}px`,
      width: `${itemRect.width}px`,
    });
  }, [theme, themeOptions]);

  return (
    <div className="flex flex-col gap-2">
      <div>{t("label")}</div>
      <div
        ref={containerRef}
        className="relative flex h-9 w-[280px] overflow-hidden rounded-xl border border-input bg-bg p-1"
      >
        <div
          className="absolute z-2 h-[25.2px] rounded-xl bg-accent transition-all duration-400 ease-out"
          style={thumbStyle}
        />

        {themeOptions.map((option, index) => (
          <div
            key={option.key}
            ref={setItemRef(index)}
            className={cn(
              "relative z-2 flex w-1/3 cursor-pointer items-center justify-center gap-1 rounded-xl text-sm",
              theme === option.key
                ? "text-accent-fg"
                : "z-1 text-secondary-fg hover:bg-hover-primary",
            )}
            onMouseDown={() => handleThemeChange(option.key as Theme)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleThemeChange(option.key as Theme);
              }
            }}
            aria-checked={theme === option.key}
            role="switch"
            tabIndex={0}
          >
            {option.icon}
            <span>{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
