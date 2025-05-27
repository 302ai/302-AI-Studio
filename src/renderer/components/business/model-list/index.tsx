import { Checkbox } from "@renderer/components/ui/checkbox";
import type { ModelProvider } from "@renderer/types/providers";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { areEqual, FixedSizeList as List } from "react-window";
import { cn } from "@/src/renderer/lib/utils";
import { useModelSettingStore } from "@/src/renderer/store/settings-store/model-setting-store";
import type { Model } from "@/src/renderer/types/models";
import { ActionGroup } from "../action-group";
import { ModelIcon } from "../model-icon";

const Row = memo(function Row({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: { models: Model[]; providerMap: Record<string, ModelProvider> };
}) {
  const { models, providerMap } = data;
  const item = models[index];
  const provider = providerMap[item.providerId];
  const isLast = index === models.length - 1;

  const handleCheckboxChange = () => {
    console.log("checked");
  };
  const handleEdit = () => {};
  const handleDelete = () => {};
  const handleStar = () => {};

  return (
    <div
      style={style}
      className={cn(
        "outline-transparent ring-primary hover:bg-hover-primary",
        !isLast ? "border-border border-b" : ""
      )}
    >
      <div className="flex items-center">
        <Checkbox
          className="ml-4 cursor-pointer"
          isSelected={item.enabled}
          onChange={handleCheckboxChange}
        />

        <div className="flex-1 px-4 py-2.5 align-middle outline-hidden">
          {item.name}
        </div>
        <div className="mr-4 px-4 py-2.5 align-middle outline-hidden">
          <div className="flex items-center gap-2">
            <ModelIcon modelId={provider.id} />
            {provider.name}
          </div>
        </div>
        <ActionGroup
          className="my-auto"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStar={handleStar}
        />
      </div>
    </div>
  );
},
areEqual);

export function ModelList() {
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
            {Row}
          </List>
        ) : (
          <div className="flex h-32 items-center justify-center text-muted-fg">
            No models available
          </div>
        )}
      </div>
    </div>
  );
}
