import { Button } from "@renderer/components/ui/button";
import { useTabBar } from "@renderer/hooks/use-tab-bar";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function SettingButton() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings",
  });

  const { handleAddNewTab } = useTabBar();

  return (
    <Button
      className="h-[40px] w-full flex-row items-center justify-start gap-x-2.5 rounded-[10px] hover:bg-hover"
      intent="plain"
      style={noDragRegion}
      onPress={() => handleAddNewTab("setting")}
    >
      <Settings className="h-4 w-4" />
      <span className="text-sm">{t("text")}</span>
    </Button>
  );
}
