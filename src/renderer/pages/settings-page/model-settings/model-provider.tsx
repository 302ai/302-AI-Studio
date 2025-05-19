import { Button } from "@renderer/components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

export function ModelProvider() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div>{t("settings.model-settings.model-provider.label")}</div>
        <Button className="w-fit" intent="secondary">
          <Plus className="size-4" />
          {t("settings.model-settings.model-provider.add-provider")}
        </Button>
      </div>
    </div>
  );
}
