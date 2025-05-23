import { ProviderList } from "@renderer/components/business/provider-list";
import { useTranslation } from "react-i18next";

export function ModelProvider() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider",
  });

  return (
    <div className="flex h-1/2 flex-col">
      <div className="flex h-full flex-col gap-2">
        <div>{t("label")}</div>

        <ProviderList />
      </div>
    </div>
  );
}
