import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";
import type { ModelProvider } from "@shared/types/provider";
import { PackageOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
import { SearchField } from "../../ui/search-field";
import { ModelFilter } from "./model-filter";
import { RowList } from "./row-list";

export function ModelList() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-list",
  });
  const {
    modelProviders,
    selectedModelProvider,
    providerModelMap,
    getAllModels,
  } = useModelSettingStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const [containerHeight, setContainerHeight] = useState(0);
  const [tabKey, setTabKey] = useState<React.Key>("current");
  const [searchQuery, setSearchQuery] = useState("");

  const collected = tabKey === "collected";

  // * Get base models based on selected provider and tab
  const baseModels = useMemo(() => {
    if (!selectedModelProvider?.id) {
      return getAllModels({ collected });
    }

    const providerModels = providerModelMap[selectedModelProvider.id] || [];
    return providerModels.filter((model) =>
      collected ? model.collected : true
    );
  }, [getAllModels, providerModelMap, selectedModelProvider?.id, collected]);

  // * Apply search filter to base models
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return baseModels;
    }

    const query = searchQuery.toLowerCase().trim();
    return baseModels.filter((model) => model.id.toLowerCase().includes(query));
  }, [baseModels, searchQuery]);

  const providerMap = useMemo<Record<string, ModelProvider>>(() => {
    return modelProviders.reduce((acc, provider) => {
      acc[provider.id] = provider;
      return acc;
    }, {});
  }, [modelProviders]);

  const listData = useMemo(
    () => ({
      models: filteredModels,
      providerMap,
    }),
    [filteredModels, providerMap]
  );

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 20; // * 20px for the padding and 40px for the model filter
        setContainerHeight(Math.max(200, Math.min(600, availableHeight)));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <ModelFilter onTabChange={setTabKey} />
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("search-placeholder")}
        />
      </div>
      <div
        ref={containerRef}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-border"
      >
        {/* Virtualized List Body */}
        <div className="w-full min-w-full flex-1 caption-bottom text-sm outline-hidden">
          {filteredModels.length > 0 ? (
            <List
              height={containerHeight}
              itemCount={filteredModels.length}
              itemSize={40}
              itemData={listData}
              overscanCount={5}
              width="100%"
              style={{
                scrollbarGutter: "stable",
              }}
            >
              {RowList}
            </List>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-fg">
              <div className="flex flex-col items-center gap-2">
                <PackageOpen className="size-9" />
                <p>{t("no-models-description")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
