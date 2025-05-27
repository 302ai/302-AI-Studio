import type { ModelProvider } from "@renderer/types/providers";
import { PackageOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FixedSizeList as List } from "react-window";
import { useModelSettingStore } from "@/src/renderer/store/settings-store/model-setting-store";
import { RowList } from "./row-list";

export function ModelList() {
  const { t } = useTranslation();
  const { modelProviders, selectedModelProvider, getModelsByProvider } =
    useModelSettingStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const [containerHeight, setContainerHeight] = useState(0);

  const models = useMemo(() => {
    return getModelsByProvider(selectedModelProvider?.id);
  }, [getModelsByProvider, selectedModelProvider?.id]);

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

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 20;
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
