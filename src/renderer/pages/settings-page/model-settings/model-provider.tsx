import { useTranslation } from "react-i18next";
import { ProviderList } from "@renderer/components/business/provider-list";

export function ModelProvider() {
  const { t } = useTranslation();

  return (
    <div className="flex h-1/2 flex-col gap-2">
      <div className="flex h-full flex-col gap-2">
        <div>{t("settings.model-settings.model-provider.label")}</div>

        <ProviderList />
      </div>
    </div>
  );
}
