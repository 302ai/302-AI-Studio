import { triplitClient } from "@renderer/client";
import { Label } from "@renderer/components/ui/field";
import { Switch } from "@renderer/components/ui/switch";
import { useQueryOne } from "@triplit/react";
import { useTranslation } from "react-i18next";

const { settingsService } = window.service;

export function ChatSettings() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.preference-settings",
  });

  const settingsQuery = triplitClient.query("settings");
  const { result } = useQueryOne(triplitClient, settingsQuery);

  const handleDisplayAppStoreChange = async (value: boolean) => {
    await settingsService.setDisplayAppStore(value);
  };

  const handleCollapseCodeBlockChange = async (value: boolean) => {
    await settingsService.setCollapseCodeBlock(value);
  };

  const handleHideReasonChange = async (value: boolean) => {
    await settingsService.setHideReason(value);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Display App Store Setting */}
      <div className="flex flex-col gap-2">
        <Label className="text-label-fg">{t("display-app-store.label")}</Label>
        {result && (
          <Switch
            className="h-11 min-w-[398px] rounded-[10px] bg-setting px-3.5 py-2.5"
            isSelected={result?.displayAppStore}
            onChange={handleDisplayAppStoreChange}
          >
            <Label className="self-center">
              {t("display-app-store.switch.label")}
            </Label>
          </Switch>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-label-fg">
          {t("collapse-code-block.label")}
        </Label>
        {result && (
          <>
            {/* 自动折叠代码块 */}
            <Switch
              className="h-11 min-w-[398px] rounded-[10px] bg-setting px-3.5 py-2.5"
              isSelected={result?.collapseCodeBlock ?? false}
              onChange={handleCollapseCodeBlockChange}
            >
              <Label className="self-center">
                {t("collapse-code-block.switch.hide-code")}
              </Label>
            </Switch>

            {/* 隐藏推理过 */}
            <Switch
              className="h-11 min-w-[398px] rounded-[10px] bg-setting px-3.5 py-2.5"
              isSelected={result?.hideReason ?? false}
              onChange={handleHideReasonChange}
            >
              <Label className="self-center">
                {t("collapse-code-block.switch.hide-reason")}
              </Label>
            </Switch>
          </>
        )}
      </div>
    </div>
  );
}
