import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";
import type { ModelProvider } from "@renderer/types/providers";
import { PackageOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
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
  const [tabKey, setTabKey] = useState<React.Key>("all");

  const collected = tabKey === "collected";

  const models = useMemo(() => {
    if (!selectedModelProvider?.id) {
      return getAllModels({ collected });
    }

    const providerModels = providerModelMap[selectedModelProvider.id] || [];
    return providerModels.filter((model) =>
      collected ? model.collected : true
    );
  }, [getAllModels, providerModelMap, selectedModelProvider?.id, collected]);

  const providerMap = useMemo<Record<string, ModelProvider>>(() => {
    return modelProviders.reduce((acc, provider) => {
      acc[provider.id] = provider;
      return acc;
    }, {});
  }, [modelProviders]);

  const listData = useMemo(
    () => ({
      models,
      providerMap,
    }),
    [models, providerMap]
  );

  const handleTabChange = (key: React.Key) => {
    setTabKey(key);
  };

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 57; // * 20px for the padding and 37px for the model filter
        setContainerHeight(Math.max(200, Math.min(600, availableHeight)));
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border"
    >
      <ModelFilter onTabChange={handleTabChange} />

      {/* Virtualized List Body */}
      <div className="w-full min-w-full flex-1 caption-bottom text-sm outline-hidden">
        {models.length > 0 ? (
          <List
            height={containerHeight}
            itemCount={models.length}
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
  );
}
