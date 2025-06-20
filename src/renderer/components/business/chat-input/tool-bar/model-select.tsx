/** biome-ignore-all lint/a11y/useKeyWithClickEvents: ignore */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: ignore */
import { IconChevronLgDown } from "@intentui/icons";
import { triplitClient } from "@renderer/client";
import { ModelIcon } from "@renderer/components/business/model-icon";
import { Button } from "@renderer/components/ui/button";
import { SearchField } from "@renderer/components/ui/search-field";
import type { Model, Provider } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { SearchX } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFilter } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
import { type ListItem, ModelRowList } from "./model-row-list";

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

  const handleModelSelect = useCallback(
    (modelId: string) => {
      setIsOpen(false);
      onSelect(modelId);
    },
    [onSelect],
  );

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
      const enabledModels = models.filter((model) => model.enabled);

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

  const filteredItems = useMemo(() => {
    const items: ListItem[] = [];
    const hasSearch = searchQuery.trim();
    const query = hasSearch ? searchQuery.toLowerCase().trim() : "";

    groupedModels.forEach((group) => {
      let matchingModels = group.models;

      if (hasSearch) {
        matchingModels = group.models.filter((model) =>
          contains(model.name, query),
        );
      }

      if (matchingModels.length > 0) {
        items.push({
          type: "group",
          id: `group-${group.id}`,
          name: group.name,
          providerId: group.id,
          model: {} as Model,
        });

        matchingModels.forEach((model) => {
          items.push({
            type: "model",
            id: model.id,
            name: model.name,
            providerId: group.id,
            model,
          });
        });
      }
    });

    return items;
  }, [groupedModels, searchQuery, contains]);

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
      <Button
        ref={triggerRef}
        className="group flex items-center gap-2 px-1 [--btn-overlay:theme(--color-hover-transparent)]"
        onClick={() => setIsOpen(!isOpen)}
        intent="plain"
      >
        {selectedModel ? (
          <>
            <ModelIcon
              modelName={selectedModel.name}
              className="dark:bg-white"
            />
            <span className="truncate text-muted-fg group-hover:text-fg">
              {selectedModel.name}
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

      {isOpen && (
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
                height={Math.min(250, filteredItems.length * 30)}
                itemCount={filteredItems.length}
                itemSize={30}
                itemData={listData}
                overscanCount={5}
                width="100%"
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
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
