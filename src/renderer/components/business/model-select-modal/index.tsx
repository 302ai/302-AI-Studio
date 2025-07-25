import {
  type ListItem,
  ModelRowList,
} from "@renderer/components/business/chat-input/tool-bar/model-row-list";
import { Modal } from "@renderer/components/ui/modal";
import { SearchField } from "@renderer/components/ui/search-field";
import { cn } from "@renderer/lib/utils";
import type { Model, Provider } from "@shared/triplit/types";
import { SearchX } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFilter } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";

interface GroupedModel {
  id: string;
  name: string;
  models: Model[];
}

interface CustomOption {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

interface ModelSelectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (modelId: string) => void;
  selectedModelId?: string;
  providers: Provider[];
  models: Model[];
  customOptions?: CustomOption[];
  translationKeyPrefix?: string;
  searchPlaceholder?: string;
  noModelsFoundText?: string;
}

export const ModelSelectModal = ({
  isOpen,
  onOpenChange,
  onSelect,
  selectedModelId = "",
  providers,
  models,
  customOptions = [],
  translationKeyPrefix = "chat",
  searchPlaceholder,
  noModelsFoundText,
}: ModelSelectModalProps) => {
  const { t } = useTranslation("translation", {
    keyPrefix: translationKeyPrefix,
  });

  const { contains } = useFilter({ sensitivity: "base" });

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  const listRef = useRef<List>(null);
  const scrollPositionRef = useRef<number>(0);

  const handleModelSelect = useCallback(
    (modelId: string) => {
      onOpenChange(false);
      onSelect(modelId);
    },
    [onSelect, onOpenChange],
  );

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

  const handleScroll = useCallback(
    ({ scrollOffset }: { scrollOffset: number }) => {
      scrollPositionRef.current = scrollOffset;
    },
    [],
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

  // Update expanded groups when modal opens or groupedModels changes
  useEffect(() => {
    if (isOpen && groupedModels.length > 0) {
      setExpandedGroups(
        new Set(groupedModels.map((group) => `group-${group.name}`)),
      );
    }
  }, [isOpen, groupedModels]);

  // Filter and flatten items for the list
  const filteredItems = useMemo(() => {
    const items: ListItem[] = [];
    const query = searchQuery.toLowerCase().trim();
    const hasSearch = !!query;

    // Add custom options at the beginning (only when not searching)
    if (!hasSearch && customOptions && customOptions.length > 0) {
      for (const option of customOptions) {
        items.push({
          type: "model",
          id: option.id,
          name: option.name,
          providerId: "custom",
          model: {
            id: option.id,
            name: option.name,
            remark: option.name,
            capabilities: new Set<string>(),
            collected: false,
            enabled: true,
            custom: true,
            type: "language" as const,
            providerId: "custom",
          } as Model,
          remark: option.name,
        });
      }
    }

    for (const group of groupedModels) {
      const filteredModels = group.models.filter(
        (model) =>
          contains(model.name, query) || contains(model.remark || "", query),
      );

      if (filteredModels.length === 0 && query) continue;

      const groupId = `group-${group.name}`;

      // Add group header
      items.push({
        type: "group",
        id: groupId,
        name: group.name,
        providerId: group.id,
        model: {} as Model,
        remark: group.name,
      });

      // Check if group should show models
      const shouldShowModels = hasSearch
        ? !expandedGroups.has(`collapsed-${groupId}`)
        : expandedGroups.has(groupId);

      if (shouldShowModels) {
        // Separate collected and non-collected models
        const collectedModels = filteredModels.filter(
          (model) => model.collected,
        );
        const nonCollectedModels = filteredModels.filter(
          (model) => !model.collected,
        );

        // Add collected models first
        for (const model of collectedModels) {
          items.push({
            type: "model",
            id: model.id,
            name: model.name,
            providerId: model.providerId,
            model,
            remark: model.remark || "",
          });
        }

        // Then add non-collected models
        for (const model of nonCollectedModels) {
          items.push({
            type: "model",
            id: model.id,
            name: model.name,
            providerId: model.providerId,
            model,
            remark: model.remark || "",
          });
        }
      }
    }

    return items;
  }, [groupedModels, searchQuery, expandedGroups, contains, customOptions]);

  // Calculate content height
  const contentHeight = Math.min(filteredItems.length * 52, 250);

  const listData = useMemo(
    () => ({
      items: filteredItems,
      onSelect: handleModelSelect,
      selectedModelId,
      onToggleGroup: handleToggleGroup,
      expandedGroups,
      hasSearch: !!searchQuery.trim(),
      showStar: translationKeyPrefix === "chat",
    }),
    [
      filteredItems,
      handleModelSelect,
      selectedModelId,
      handleToggleGroup,
      expandedGroups,
      searchQuery,
      translationKeyPrefix,
    ],
  );

  const defaultSearchPlaceholder =
    translationKeyPrefix === "chat"
      ? t("model-search-placeholder")
      : t("model-select.search-placeholder");

  const defaultNoModelsText =
    translationKeyPrefix === "chat"
      ? t("no-models-found")
      : t("model-select.no-models-found");

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Content
        className="min-w-[638px] dark:bg-[#242424]"
        closeButton={false}
      >
        {() => (
          <>
            <div className="p-4">
              <SearchField
                className="h-[44px] rounded-lg bg-[#F9F9F9] dark:bg-[#1A1A1A]"
                placeholder={searchPlaceholder || defaultSearchPlaceholder}
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
                  <p>{noModelsFoundText || defaultNoModelsText}</p>
                </div>
              )}
            </div>
          </>
        )}
      </Modal.Content>
    </Modal>
  );
};
