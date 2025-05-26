import { ModelList } from "@renderer/components/business/model-list";
import { useTranslation } from "react-i18next";

export function ProviderModel() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-list",
  });

  return (
    <div className="flex h-1/2 flex-col gap-2">
      <div className="flex h-full flex-col gap-2">
        <div>{t("label")}</div>

        <ModelList />
      </div>
    </div>
  );
}
