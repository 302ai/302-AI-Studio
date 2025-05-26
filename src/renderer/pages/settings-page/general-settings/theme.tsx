import { cn } from "@renderer/lib/utils";
import { useSettingsStore } from "@renderer/store/settings-store";
import { ThemeMode } from "@renderer/types/settings";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsLaptop, BsMoon, BsSun } from "react-icons/bs";

export function ThemeSwitcher() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.general-settings.theme",
  });
  const { theme, setTheme } = useSettingsStore();

  const [thumbStyle, setThumbStyle] = useState({});

  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const setItemRef = (index: number) => (el: HTMLDivElement | null) => {
    itemsRef.current[index] = el;
  };

  const themeOptions = useMemo(
    () => [
      {
        key: ThemeMode.Light,
        icon: <BsSun className="size-4" />,
        label: t("light"),
      },
      {
        key: ThemeMode.Dark,
        icon: <BsMoon className="size-4" />,
        label: t("dark"),
      },
      {
        key: ThemeMode.System,
        icon: <BsLaptop className="size-4" />,
        label: t("system"),
      },
    ],
    [t]
  );

  useEffect(() => {
    const currentIndex = themeOptions.findIndex(
      (option) => option.key === theme
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
                : "z-1 text-secondary-fg hover:bg-hover-primary"
            )}
            onMouseDown={() => handleThemeChange(option.key as ThemeMode)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleThemeChange(option.key as ThemeMode);
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
