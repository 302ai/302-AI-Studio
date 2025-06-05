import { useProviderList } from "@renderer/hooks/use-provider-list";
import { triplitClient } from "@shared/triplit/client";
import type { Model } from "@shared/triplit/types";
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
  const { selectedProvider } = useProviderList();

  const containerRef = useRef<HTMLDivElement>(null);

  const [containerHeight, setContainerHeight] = useState(0);
  const [tabKey, setTabKey] = useState<React.Key>("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState<Model[]>([]);

  const collected = tabKey === "collected";

  // * Get base models based on selected provider and tab
  const baseModels = useMemo(() => {
    if (!selectedProvider?.id) {
      return models;
    }

    const providerModels = models.filter(
      (model) => model.providerId === selectedProvider.id,
    );
    return providerModels.filter((model) =>
      collected ? model.collected : true,
    );
  }, [models, selectedProvider?.id, collected]);

  // * Apply search filter to base models
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return baseModels;
    }

    const query = searchQuery.toLowerCase().trim();
    return baseModels.filter((model) =>
      model.name.toLowerCase().includes(query),
    );
  }, [baseModels, searchQuery]);

  const listData = useMemo(
    () => ({
      models: filteredModels,
    }),
    [filteredModels],
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

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAndSubscribe = async () => {
      try {
        await triplitClient.connect();

        const modelsQuery = triplitClient.query("models");

        unsubscribe =
            triplitClient.subscribe(
            modelsQuery,
            (results) => {
              console.log("收到model list数据更新");
              setModels(results);
            },
            (error) => {
              console.error("model list订阅错误:", error);
            },
          );
      } catch (error) {
        console.error("初始化错误:", error);
      }
    };

    initAndSubscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
