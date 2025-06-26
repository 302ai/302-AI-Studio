import { triplitClient } from "@renderer/client";
import { useActiveProvider } from "@renderer/hooks/use-active-provider";
import type { Provider } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { PackageOpen } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
import { SearchField } from "../../ui/search-field";
import { Fetching } from "../fetching";
import { ModelFilter } from "./model-filter";
import { RowList } from "./row-list";

export function ModelList() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-list",
  });
  const { selectedProvider } = useActiveProvider();

  const modelsQuery = triplitClient.query("models");
  const { results: allModels = [], fetching: modelsFetching } = useQuery(
    triplitClient,
    modelsQuery,
  );

  const providersQuery = triplitClient.query("providers").Order("order", "ASC");
  const { results: allProviders = [], fetching: providersFetching } = useQuery(
    triplitClient,
    providersQuery,
  );

  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);

  const [containerHeight, setContainerHeight] = useState(window.innerHeight);

  const updateHeight = useCallback(() => {
    console.log("updateHeight --- model-list");
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const availableHeight = window.innerHeight - rect.top - 24;
    setContainerHeight(availableHeight);
  }, []);

  const [tabKey, setTabKey] = useState<React.Key>("current");
  const [searchQuery, setSearchQuery] = useState("");

  // 创建 providers 映射表，方便快速查找
  const providersMap = useMemo(() => {
    if (!allProviders) return {};

    return allProviders.reduce(
      (map, provider) => {
        map[provider.id] = provider;
        return map;
      },
      {} as Record<string, Provider>,
    );
  }, [allProviders]);

  const collected = tabKey === "collected";

  // * Get base models based on selected provider and tab
  const baseModels = useMemo(() => {
    if (!allModels) {
      return [];
    }

    const providerFilteredModels = selectedProvider?.id
      ? allModels.filter((model) => model.providerId === selectedProvider.id)
      : allModels;

    return providerFilteredModels.filter((model) =>
      collected ? model.collected : true,
    );
  }, [allModels, collected, selectedProvider]);

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
      providersMap, // 将 providers 映射表传递给子组件
    }),
    [filteredModels, providersMap],
  );

  useLayoutEffect(() => {
    updateHeight();
  }, [updateHeight]);

  useEffect(() => {
    window.addEventListener("resize", updateHeight);
    const ro = new ResizeObserver(updateHeight);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", updateHeight);
      ro.disconnect();
    };
  }, [updateHeight]);

  useEffect(() => {
    if (!providersFetching && !modelsFetching) {
      startTransition(() => {
        setReady(true);
      });
    }
  }, [providersFetching, modelsFetching]);

  const loading = !ready || isPending;

  if (allModels.length === 0) {
    return null;
  }

  return (
    <>
      <div>{t("label")}</div>

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
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: containerHeight }}
          >
            <Fetching />
          </div>
        ) : (
          <div className="w-full min-w-full flex-1 caption-bottom text-sm outline-hidden">
            {filteredModels.length > 0 ? (
              <List
                height={containerHeight}
                itemCount={filteredModels.length}
                itemSize={40}
                itemData={listData}
                overscanCount={10}
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
        )}
      </div>
    </>
  );
}
