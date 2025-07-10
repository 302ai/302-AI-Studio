/** biome-ignore-all lint/a11y/useKeyWithClickEvents: ignore */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: ignore */
import { IconChevronLgDown } from "@intentui/icons";
import { triplitClient } from "@renderer/client";
import { ModelIcon } from "@renderer/components/business/model-icon";
import { Button } from "@renderer/components/ui/button";
import { SearchField } from "@renderer/components/ui/search-field";
import { useActiveTab } from "@renderer/hooks/use-active-tab";
import logger from "@shared/logger/renderer-logger";
import type { Model, Provider, Tab } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { SearchX } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFilter } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
import { type ListItem, ModelRowList } from "./model-row-list";

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

  const { contains } = useFilter({ sensitivity: "base" });
  const { setActiveTabId, tabs } = useActiveTab();

  // Use triplit queries instead of model-setting-store
  const providersQuery = triplitClient
    .query("providers")
    .Where("enabled", "=", true)
    .Order("order", "ASC");
  const { results: providers } = useQuery(triplitClient, providersQuery);

  const modelsQuery = triplitClient.query("models").Where("enabled", "=", true);
  const { results: models } = useQuery(triplitClient, modelsQuery);

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<List>(null);
  const scrollPositionRef = useRef<number>(0);

  const handleModelSelect = useCallback(
    (modelId: string) => {
      setIsOpen(false);
      onSelect(modelId);
    },
    [onSelect],
  );

  const handleToggleOpen = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleScroll = useCallback((props: { scrollOffset: number }) => {
    scrollPositionRef.current = props.scrollOffset;
  }, []);

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
        });
        await setActiveTabId(newTab.id);
      }
    } catch (error) {
      logger.error("Error opening model settings", { error });
    }
  }, [setActiveTabId, tabs, t]);

  // Create provider map and provider model map from triplit data
  const { providerMap, providerModelMap } = useMemo(() => {
    const providersArray = providers ?? [];
    const modelsArray = models ?? [];

    const providerMap: Record<string, Provider> = {};
    const providerModelMap: Record<string, Model[]> = {};

    // Build provider map
    providersArray.forEach((provider) => {
      providerMap[provider.id] = provider;
    });

    // Build provider model map
    modelsArray.forEach((model) => {
      if (!providerModelMap[model.providerId]) {
        providerModelMap[model.providerId] = [];
      }
      providerModelMap[model.providerId].push(model);
    });

    return { providerMap, providerModelMap };
  }, [providers, models]);

  const groupedModels = useMemo(() => {
    const result: GroupedModel[] = [];

    Object.entries(providerModelMap).forEach(([providerId, models]) => {
      const enabledModels = models
        .filter((model) => model.enabled)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (enabledModels.length > 0) {
        result.push({
          id: providerId,
          name: providerMap[providerId]?.name || providerId,
          models: enabledModels,
        });
      }
    });

    return result;
  }, [providerModelMap, providerMap]);

  // Check if there are no available providers or models
  const hasNoProviders = useMemo(() => {
    return !providers || providers.length === 0 || groupedModels.length === 0;
  }, [providers, groupedModels]);

  const filteredItems = useMemo(() => {
    const items: ListItem[] = [];
    const hasSearch = searchQuery.trim();
    const query = hasSearch ? searchQuery.toLowerCase().trim() : "";

    const allModels: Array<{
      model: Model;
      providerId: string;
      providerName: string;
    }> = [];
    groupedModels.forEach((group) => {
      group.models.forEach((model) => {
        allModels.push({
          model,
          providerId: group.id,
          providerName: group.name,
        });
      });
    });

    const filteredModels = hasSearch
      ? allModels.filter(({ model }) =>
          contains(model.remark || model.name, query),
        )
      : allModels;

    const collectedModels = filteredModels
      .filter(({ model }) => model.collected)
      .sort((a, b) => a.model.name.localeCompare(b.model.name));
    const nonCollectedModels = filteredModels
      .filter(({ model }) => !model.collected)
      .sort((a, b) => a.model.name.localeCompare(b.model.name));

    if (collectedModels.length > 0) {
      items.push({
        type: "group",
        id: "group-collected",
        name: t("collected"),
        providerId: "collected",
        model: {} as Model,
        remark: "",
      });

      collectedModels.forEach(({ model, providerId }) => {
        items.push({
          type: "model",
          id: model.id,
          name: model.name,
          providerId,
          model,
          remark: model.remark || model.name,
        });
      });
    }

    groupedModels.forEach((group) => {
      const groupNonCollectedModels = nonCollectedModels.filter(
        ({ providerId }) => providerId === group.id,
      );

      if (groupNonCollectedModels.length > 0) {
        items.push({
          type: "group",
          id: `group-${group.id}`,
          name: group.name,
          providerId: group.id,
          model: {} as Model,
          remark: group.name,
        });

        groupNonCollectedModels
          .sort((a, b) => a.model.name.localeCompare(b.model.name))
          .forEach(({ model }) => {
            items.push({
              type: "model",
              id: model.id,
              name: model.name,
              providerId: group.id,
              model,
              remark: model.remark || model.name,
            });
          });
      }
    });

    return items;
  }, [groupedModels, searchQuery, contains, t]);

  const listData = useMemo(
    () => ({
      items: filteredItems,
      onSelect: handleModelSelect,
      selectedModelId,
    }),
    [filteredItems, handleModelSelect, selectedModelId],
  );

  const selectedModel = useMemo(() => {
    if (!selectedModelId) return null;
    for (const group of groupedModels) {
      const model = group.models.find((m) => m.id === selectedModelId);
      if (model) return model;
    }
    return null;
  }, [selectedModelId, groupedModels]);

  return (
    <div className="relative flex w-fit min-w-[130px] justify-end">
      {hasNoProviders ? (
        <Button
          className="group hover:!bg-transparent flex cursor-pointer items-center transition-colors"
          onClick={handleOpenModelSettings}
          intent="plain"
        >
          <span className="truncate text-[#494454] text-sm underline dark:text-[#FFFFFF]">
            {t("model-select")}
          </span>
        </Button>
      ) : (
        <Button
          ref={triggerRef}
          className="group flex items-center gap-2 px-1 [--btn-overlay:theme(--color-hover-transparent)]"
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
            className={`size-4 shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      )}

      {isOpen && !hasNoProviders && (
        <div className="absolute bottom-full z-50 mb-1 min-w-[240px] max-w-[240px] overflow-hidden rounded-md border border-border bg-overlay shadow-md">
          <div className="border-b bg-muted p-2">
            <SearchField
              className="rounded-lg bg-bg"
              placeholder={t("model-search-placeholder")}
              value={searchQuery}
              onChange={setSearchQuery}
              autoFocus
            />
          </div>
          <div className="max-h-[250px] min-w-[240px] max-w-[240px] p-1">
            {filteredItems.length > 0 ? (
              <List
                ref={listRef}
                height={Math.min(250, filteredItems.length * 30)}
                itemCount={filteredItems.length}
                itemSize={30}
                itemData={listData}
                overscanCount={5}
                width="100%"
                initialScrollOffset={scrollPositionRef.current}
                onScroll={handleScroll}
                style={{
                  scrollbarGutter: "stable",
                }}
              >
                {ModelRowList}
              </List>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center gap-2 p-4 text-muted-fg text-sm">
                <SearchX className="size-8" />
                <p>{t("no-models-found")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && !hasNoProviders && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
