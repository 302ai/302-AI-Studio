import { IconChevronLgDown } from "@intentui/icons";
import { ModelIcon } from "@renderer/components/business/model-icon";
import { ModelSelectModal } from "@renderer/components/business/model-select-modal";
import { Button } from "@renderer/components/ui/button";
import { useActiveTab } from "@renderer/hooks/use-active-tab";
import { useGlobalShortcutHandler } from "@renderer/hooks/use-global-shortcut-handler";
import { useModelSelect } from "@renderer/hooks/use-model-select";
import { cn } from "@renderer/lib/utils";
import logger from "@shared/logger/renderer-logger";
import type { Model, Tab } from "@shared/triplit/types";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

const { tabService } = window.service;

interface GroupedModel {
  id: string;
  name: string;
  models: Model[];
}

interface ModelSelectProps {
  onSelect: (modelId: string) => void;
  selectedModelId?: string;
}

export const ModelSelect = ({
  onSelect,
  selectedModelId = "",
}: ModelSelectProps) => {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });

  const { setActiveTabId, tabs } = useActiveTab();

  const { providers, models, isOpen, setIsOpen, handleToggleOpen } =
    useModelSelect({
      onSelect,
    });

  const handleOpenModelSettings = useCallback(async () => {
    try {
      const existingSettingTab = tabs?.find(
        (tab: Tab) => tab.type === "setting",
      );

      if (existingSettingTab) {
        await tabService.updateTab(existingSettingTab.id, {
          path: "/settings/model-settings",
        });
        await setActiveTabId(existingSettingTab.id);
      } else {
        const newTab = await tabService.insertTab({
          title: t("tab-title"),
          type: "setting",
          path: "/settings/model-settings",
          isPrivate: true,
        });
        await setActiveTabId(newTab.id);
      }
    } catch (error) {
      logger.error("Error opening model settings", { error });
    }
  }, [setActiveTabId, tabs, t]);

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

  // Check if there are no available providers or models
  const hasNoProviders = useMemo(() => {
    return !providers || providers.length === 0 || groupedModels.length === 0;
  }, [providers, groupedModels]);

  // Find the selected model
  const selectedModel = useMemo(() => {
    if (!selectedModelId) return null;
    for (const group of groupedModels) {
      const model = group.models.find((m) => m.id === selectedModelId);
      if (model) return model;
    }
    return null;
  }, [selectedModelId, groupedModels]);

  useGlobalShortcutHandler("toggle-model-panel", () => handleToggleOpen());

  return (
    <div className="relative flex h-full w-fit min-w-[130px] justify-end">
      {hasNoProviders ? (
        <Button
          className="group flex items-center hover:bg-transparent"
          onClick={handleOpenModelSettings}
          intent="plain"
        >
          <span className="truncate text-muted-fg text-sm underline">
            {t("model-select")}
          </span>
        </Button>
      ) : (
        <Button
          className="group flex h-9 max-w-[400px] items-center gap-2 pressed:bg-transparent px-1 hover:bg-transparent"
          onClick={handleToggleOpen}
          intent="plain"
        >
          {selectedModel ? (
            <>
              <ModelIcon modelName={selectedModel.name} />
              <span className="truncate text-muted-fg group-hover:text-fg">
                {selectedModel.remark || selectedModel.name}
              </span>
            </>
          ) : (
            <span className="truncate text-muted-fg group-hover:text-fg">
              {t("model-select-placeholder")}
            </span>
          )}
          <IconChevronLgDown
            className={cn("size-4", isOpen ? "" : "rotate-180")}
          />
        </Button>
      )}

      <ModelSelectModal
        isOpen={isOpen && !hasNoProviders}
        onOpenChange={setIsOpen}
        onSelect={onSelect}
        selectedModelId={selectedModelId}
        providers={providers}
        models={models}
        translationKeyPrefix="chat"
      />

      {/* Click outside to close */}
      {isOpen && !hasNoProviders && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
        />
      )}
    </div>
  );
};
