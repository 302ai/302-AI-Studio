import { Label } from "@renderer/components/ui/field";
import { Switch } from "@renderer/components/ui/switch";
import { useTranslation } from "react-i18next";

export function VersionUpdate() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.general-settings",
  });

  return (
    <div className="mx-auto flex flex-col gap-2">
      <Label className="text-label-fg">{t("version-update.label")}</Label>
      <Switch className="w-[398px]">
        <Label>{t("switch.label")}</Label>
      </Switch>
    </div>
  );
}
