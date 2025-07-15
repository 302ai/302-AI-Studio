import { triplitClient } from "@renderer/client";
import { LdrsLoader } from "@renderer/components/business/ldrs-loader";
import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/field";
import { ProgressCircle } from "@renderer/components/ui/progress-circle";
import { Switch } from "@renderer/components/ui/switch";
import { useVersionUpdate } from "@renderer/hooks/use-version-update";
import { cn } from "@renderer/lib/utils";
import { useQueryOne } from "@triplit/react";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../../package.json";

const { version } = packageJson;

export function VersionUpdate() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.general-settings.version-update",
  });

  const settingsQuery = triplitClient.query("settings");
  const { result } = useQueryOne(triplitClient, settingsQuery);

  const { status, progress, handleChange, handleActions } = useVersionUpdate();

  const showBadge = ["available", "downloading", "downloaded"].includes(status);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-label-fg">{t("label")}</Label>
      {result && (
        <Switch
          className="min-w-[398px] rounded-[10px] bg-setting px-3.5 py-3"
          isSelected={result?.autoUpdate}
          onChange={handleChange}
        >
          <Label>{t("switch.label")}</Label>
        </Switch>
      )}

      <div className="flex min-w-[398px] items-center justify-between gap-x-10 rounded-[10px] bg-setting px-3.5 py-1.5">
        <div className="flex flex-row gap-1.5 text-sm">
          <span className="text-setting-fg ">{t("version-info")}</span>
          <span className="text-muted-fg">{version}</span>
          <Badge
            intent="success"
            className={cn("text-xs", {
              hidden: !showBadge,
            })}
          >
            {status === "downloaded"
              ? t("new-version-downloaded")
              : t("new-version-available")}
          </Badge>
        </div>
        <Button
          className="h-8 text-sm"
          onPress={handleActions}
          isPending={status === "checking" || status === "downloading"}
        >
          {() => (
            <>
              {status === "checking" && (
                <div className="flex flex-row items-center gap-1.5">
                  <LdrsLoader type="line-spinner" size={16} />
                  <span>{t("checking")}</span>
                </div>
              )}
              {status === "available" && t("update-now")}
              {status === "idle" && t("check-for-updates")}
              {status === "downloading" && (
                <div className="flex flex-row items-center gap-1.5">
                  <ProgressCircle value={progress} className="size-4" />
                  <span>{t("downloading")}</span>
                </div>
              )}
              {status === "downloaded" && t("restart-to-update")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
