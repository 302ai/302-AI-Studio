import { IconChevronLgDown } from "@intentui/icons";
import { ModelIcon } from "@renderer/components/business/model-icon";
import { ModelSelectModal } from "@renderer/components/business/model-select-modal";
import { Button } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/field";
import { useModelSelect } from "@renderer/hooks/use-model-select";
import { useTriplit } from "@renderer/hooks/use-triplit";
import { cn } from "@renderer/lib/utils";
import type { Model } from "@shared/triplit/types";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

const { settingsService } = window.service;

interface GroupedModel {
  id: string;
  name: string;
  models: Model[];
}

const ModelSelect = () => {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.preference-settings",
  });

  // const settingsQuery = triplitClient.query("settings");
  // const { result: settings } = useQueryOne(triplitClient, settingsQuery);
  const { settings } = useTriplit();
  const setting = settings?.[0];
  const newChatModelId = setting?.newChatModelId || "";

  const handleModelSelect = useCallback(async (modelId: string) => {
    await settingsService.setNewChatModelId(modelId);
  }, []);

  const { providers, models, isOpen, setIsOpen, handleToggleOpen } =
    useModelSelect({
      onSelect: handleModelSelect,
    });

  // Create custom options
  const customOptions = useMemo(
    () => [
      {
        id: "use-last-model",
        name: t("model-select.use-last-model"),
      },
    ],
    [t],
  );

  // Group models by provider
  const groupedModels = useMemo(() => {
    if (!providers || !models) return [];

    const grouped: GroupedModel[] = [];
    for (const provider of providers) {
      const providerModels = models.filter(
        (model) => model.providerId === provider.id,
      );
      if (providerModels.length > 0) {
        grouped.push({
          id: provider.id,
          name: provider.name,
          models: providerModels,
        });
      }
    }
    return grouped;
  }, [providers, models]);

  // Find the selected model or custom option
  const selectedItem = useMemo(() => {
    // If newChatModelId is "use-last-model", show "use-last-model" as selected
    if (newChatModelId === "use-last-model") {
      const customOption = customOptions?.find(
        (option) => option.id === "use-last-model",
      );
      if (customOption) {
        return { type: "custom" as const, name: customOption.name };
      }
    }

    if (!newChatModelId) return null;

    // Check if it's a custom option
    const customOption = customOptions?.find(
      (option) => option.id === newChatModelId,
    );
    if (customOption) {
      return { type: "custom" as const, name: customOption.name };
    }

    for (const group of groupedModels) {
      const model = group.models.find((m) => m.id === newChatModelId);
      if (model) return { type: "model" as const, model };
    }
    return null;
  }, [newChatModelId, groupedModels, customOptions]);

  return (
    <div className="flex flex-col gap-2 ">
      <Label className="text-label-fg">{t("model-select.label")}</Label>
      <div className="relative flex w-full">
        <Button
          className="group flex h-11 w-full min-w-[398px] items-center justify-between gap-2 rounded-[10px] bg-setting pressed:bg-setting px-3.5 py-2.5 hover:bg-setting"
          onClick={handleToggleOpen}
          intent="plain"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {selectedItem ? (
              selectedItem.type === "custom" ? (
                <span className="truncate text-setting-fg">
                  {selectedItem.name}
                </span>
              ) : (
                <>
                  <ModelIcon modelName={selectedItem.model.name} />
                  <span className="truncate text-setting-fg">
                    {selectedItem.model.remark || selectedItem.model.name}
                  </span>
                </>
              )
            ) : (
              <span className="truncate text-setting-fg">
                {t("model-select.placeholder")}
              </span>
            )}
          </div>
          <IconChevronLgDown
            className={cn("size-4 text-setting-fg", isOpen ? "" : "rotate-180")}
          />
        </Button>

        <ModelSelectModal
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onSelect={handleModelSelect}
          selectedModelId={newChatModelId}
          providers={providers}
          models={models}
          customOptions={customOptions}
          translationKeyPrefix="settings.preference-settings"
        />
      </div>
    </div>
  );
};

export default ModelSelect;
