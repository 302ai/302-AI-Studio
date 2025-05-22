import { useTranslation } from "react-i18next";

export function ModelList() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-list",
  });

  return (
    <div className="flex h-1/2 flex-col gap-2">
      <div className="flex h-full flex-col gap-2">
        <div>{t("label")}</div>
      </div>
    </div>
  );
}
