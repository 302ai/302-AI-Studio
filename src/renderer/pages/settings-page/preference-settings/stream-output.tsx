import { triplitClient } from "@renderer/client";
import { Label } from "@renderer/components/ui/field";
import { Switch } from "@renderer/components/ui/switch";
import { cn } from "@renderer/lib/utils";
import { useQueryOne } from "@triplit/react";
import { Rabbit, Timer, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { settingsService } = window.service;

export function StreamOutput() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.preference-settings.stream-output",
  });

  const settingsQuery = triplitClient.query("settings");
  const { result } = useQueryOne(triplitClient, settingsQuery);

  const [thumbStyle, setThumbStyle] = useState({});
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStreamToggle = async (enabled: boolean) => {
    await settingsService.setStreamSmootherEnabled(enabled);
  };

  const handleSpeedChange = async (speed: "slow" | "normal" | "fast") => {
    await settingsService.setStreamSpeed(speed);
  };

  const setItemRef = (index: number) => (el: HTMLDivElement | null) => {
    itemsRef.current[index] = el;
  };

  const speedOptions = useMemo(
    () => [
      {
        key: "slow",
        icon: <Rabbit className="size-4" />,
        label: t("speed.slow"),
      },
      {
        key: "normal",
        icon: <Timer className="size-4" />,
        label: t("speed.normal"),
      },
      {
        key: "fast",
        icon: <Zap className="size-4" />,
        label: t("speed.fast"),
      },
    ],
    [t],
  );

  const currentSpeed = result?.streamSpeed;
  const streamSmootherEnabled = result?.streamSmootherEnabled ?? true;

  useEffect(() => {
    const currentIndex = speedOptions.findIndex(
      (option) => option.key === currentSpeed,
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
  }, [currentSpeed, speedOptions]);

  return (
    <div className="flex flex-col gap-4">
      {/* Stream Smoother Toggle */}
      <div className="flex flex-col gap-2">
        <Label className="text-label-fg">{t("smoother.label")}</Label>
        <Switch
          className="h-11 min-w-[398px] rounded-[10px] bg-setting px-3.5 py-2.5"
          isSelected={streamSmootherEnabled}
          onChange={handleStreamToggle}
        >
          <Label className="self-center">{t("smoother.switch.label")}</Label>
        </Switch>
      </div>

      {/* Stream Speed Selector */}
      {streamSmootherEnabled && (
        <div className="flex flex-col gap-2">
          <Label className="text-label-fg">{t("speed.label")}</Label>

          <div
            ref={containerRef}
            className="relative flex h-11 min-w-[398px] items-center rounded-[10px] bg-setting"
          >
            {Object.hasOwn(thumbStyle, "left") && (
              <div
                className="absolute z-2 h-[32px] min-w-[116px] rounded-md bg-accent transition-all duration-400 ease-out"
                style={thumbStyle}
              />
            )}

            <div className="flex w-full justify-around">
              {speedOptions.map((option, index) => (
                <div
                  key={option.key}
                  ref={setItemRef(index)}
                  className={cn(
                    "relative z-2 flex h-[32px] min-w-[116px] cursor-pointer items-center justify-center gap-1 rounded-md text-sm",
                    currentSpeed === option.key
                      ? "text-accent-fg"
                      : "z-1 text-secondary-fg hover:bg-hover-primary",
                  )}
                  onMouseDown={() =>
                    handleSpeedChange(option.key as "slow" | "normal" | "fast")
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpeedChange(
                        option.key as "slow" | "normal" | "fast",
                      );
                    }
                  }}
                  aria-checked={currentSpeed === option.key}
                  role="switch"
                  tabIndex={0}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
