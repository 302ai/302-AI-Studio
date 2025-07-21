import { IconChevronLgDown } from "@intentui/icons";
import { triplitClient } from "@renderer/client";
import { ModelIcon } from "@renderer/components/business/model-icon";
import { Button } from "@renderer/components/ui/button";
import { Modal } from "@renderer/components/ui/modal";
import { SearchField } from "@renderer/components/ui/search-field";
import { useActiveTab } from "@renderer/hooks/use-active-tab";
import { cn } from "@renderer/lib/utils";
import logger from "@shared/logger/renderer-logger";
import type { Model, Provider, Tab } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { SearchX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const modelsQuery = triplitClient
    .query("models")
    .Where("enabled", "=", true)
    .Order("collected", "DESC")
    .Order("name", "ASC");
  const { results: models } = useQuery(triplitClient, modelsQuery);

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = useCallback(
    (query: string) => {
      const hasSearch = query.trim();
      const previousHasSearch = searchQuery.trim();

      setSearchQuery(query);

      if (!previousHasSearch && hasSearch) {
        setExpandedGroups((prev) => {
          const newSet = new Set(prev);
          Array.from(newSet).forEach((key) => {
            if (key.startsWith("collapsed-")) {
              newSet.delete(key);
            }
          });
          return newSet;
        });
      }
    },
    [searchQuery],
  );

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

  const handleToggleGroup = useCallback(
    (groupId: string) => {
      const hasSearch = searchQuery.trim();

      setExpandedGroups((prev) => {
        const newSet = new Set(prev);

        if (hasSearch) {
          // In search mode, use collapsed state tracking
          const collapsedKey = `collapsed-${groupId}`;
          if (newSet.has(collapsedKey)) {
            newSet.delete(collapsedKey);
          } else {
            newSet.add(collapsedKey);
          }
        } else {
          if (newSet.has(groupId)) {
            newSet.delete(groupId);
          } else {
            newSet.add(groupId);
          }
        }

        return newSet;
      });
    },
    [searchQuery],
  );

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

  // Create provider map and provider model map from triplit data
  const { providerModelMap } = useMemo(() => {
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
    const providersArray = providers ?? [];
    const result: GroupedModel[] = [];

    for (const provider of providersArray) {
      const models = providerModelMap[provider.id];
      if (!models || models.length === 0) continue;

      const enabledModels = models.filter((model) => model.enabled);
      if (enabledModels.length === 0) continue;

      result.push({
        id: provider.id,
        name: provider.name,
        models: enabledModels,
      });
    }

    return result;
  }, [providerModelMap, providers]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    return new Set(groupedModels.map((group) => `group-${group.name}`));
  });

  // Reset expansion state when modal opens
  useEffect(() => {
    if (isOpen && groupedModels.length > 0) {
      // 每次打开模态框时都展开所有分组
      setExpandedGroups(
        new Set(groupedModels.map((group) => `group-${group.name}`)),
      );
    }
  }, [isOpen, groupedModels]);

  // Check if there are no available providers or models
  const hasNoProviders = useMemo(() => {
    return !providers || providers.length === 0 || groupedModels.length === 0;
  }, [providers, groupedModels]);

  const filteredItems = useMemo(() => {
    const items: ListItem[] = [];
    const hasSearch = searchQuery.trim();
    const query = hasSearch ? searchQuery.toLowerCase().trim() : "";

    groupedModels.forEach((group) => {
      const groupModels = hasSearch
        ? group.models.filter((model) =>
            contains(model.remark || model.name, query),
          )
        : group.models;

      if (groupModels.length === 0) return;

      const collectedModels = groupModels.filter((model) => model.collected);
      const nonCollectedModels = groupModels.filter(
        (model) => !model.collected,
      );

      const groupId = `group-${group.name}`;
      items.push({
        type: "group",
        id: groupId,
        name: group.name,
        providerId: group.id,
        model: {} as Model,
        remark: group.name,
      });

      const shouldShowModels = hasSearch
        ? !expandedGroups.has(`collapsed-${groupId}`)
        : expandedGroups.has(groupId);

      if (shouldShowModels) {
        collectedModels.forEach((model) => {
          items.push({
            type: "model",
            id: model.id,
            name: model.name,
            providerId: group.id,
            model,
            remark: model.remark || model.name,
          });
        });

        nonCollectedModels.forEach((model) => {
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
  }, [groupedModels, searchQuery, contains, expandedGroups]);

  const contentHeight = useMemo(() => {
    const actualHeight = filteredItems.length * 48;
    return Math.min(250, actualHeight);
  }, [filteredItems.length]);

  const listData = useMemo(
    () => ({
      items: filteredItems,
      onSelect: handleModelSelect,
      selectedModelId,
      onToggleGroup: handleToggleGroup,
      expandedGroups,
      hasSearch: !!searchQuery.trim(),
    }),
    [
      filteredItems,
      handleModelSelect,
      selectedModelId,
      handleToggleGroup,
      expandedGroups,
      searchQuery,
    ],
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
          ref={triggerRef}
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

      {isOpen && !hasNoProviders && (
        <div className="">
          <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
            <Modal.Content
              className="min-w-[638px] dark:bg-[#242424]"
              closeButton={false}
            >
              {() => (
                <>
                  <div className=" p-4">
                    <SearchField
                      className=" h-[44px] rounded-lg bg-[#F9F9F9] dark:bg-[#1A1A1A] "
                      placeholder={t("model-search-placeholder")}
                      value={searchQuery}
                      onChange={handleSearchChange}
                      autoFocus
                    />
                  </div>
                  <div
                    className={cn(
                      "min-w-[240px] px-4 pb-2",
                      contentHeight >= 250 ? "mt-2" : "mt-0",
                    )}
                  >
                    {filteredItems.length > 0 ? (
                      <List
                        ref={listRef}
                        height={contentHeight}
                        itemCount={filteredItems.length}
                        itemSize={52}
                        itemData={listData}
                        overscanCount={5}
                        width="100%"
                        initialScrollOffset={scrollPositionRef.current}
                        onScroll={handleScroll}
                        style={{
                          scrollbarGutter: "stable",
                          overflow: contentHeight >= 250 ? "auto" : "hidden",
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
                </>
              )}
            </Modal.Content>
          </Modal>
        </div>
      )}

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
