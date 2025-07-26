import { Label } from "@renderer/components/ui/field";
import { Switch } from "@renderer/components/ui/switch";
import { useDefaultPrivacyModeSetting } from "@renderer/queries";
import { useTranslation } from "react-i18next";

const { settingsService } = window.service;

export function PrivacyModeSettings() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.general-settings.privacy-mode",
  });

  const { data: defaultPrivacyMode } = useDefaultPrivacyModeSetting();

  const handlePrivacyModeToggle = async (enabled: boolean) => {
    try {
      await settingsService.setEnableDefaultPrivacyMode(enabled);
      console.log("Default privacy mode toggled:", enabled);
    } catch (error) {
      console.error("Failed to update default privacy mode:", error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-label-fg">{t("title")}</Label>
      <Switch
        className="h-11 min-w-[398px] rounded-[10px] bg-setting px-3.5 py-2.5"
        isSelected={defaultPrivacyMode ?? false}
        onChange={handlePrivacyModeToggle}
      >
        <Label className="self-center">{t("description")}</Label>
      </Switch>
    </div>
  );
}
