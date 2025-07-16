import { triplitClient } from "@renderer/client";
import { Label } from "@renderer/components/ui/field";
import { Switch } from "@renderer/components/ui/switch";
import { useQueryOne } from "@triplit/react";
import { useTranslation } from "react-i18next";

const { settingsService } = window.service;

export function DisplayAppStore() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.preference-settings.display-app-store",
  });

  const settingsQuery = triplitClient.query("settings");
  const { result } = useQueryOne(triplitClient, settingsQuery);

  const handleChange = async (value: boolean) => {
    await settingsService.setDisplayAppStore(value);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-label-fg">{t("label")}</Label>
      {result && (
        <Switch
          className="h-11 min-w-[398px] rounded-[10px] bg-setting px-3.5 py-2.5"
          isSelected={result?.displayAppStore}
          onChange={handleChange}
        >
          <Label className="self-center">{t("switch.label")}</Label>
        </Switch>
      )}
    </div>
  );
}
