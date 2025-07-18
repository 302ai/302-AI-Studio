import { triplitClient } from "@renderer/client";
import { Button } from "@renderer/components/ui/button";
import { useActiveProvider } from "@renderer/hooks/use-active-provider";
import { EventNames, emitter } from "@renderer/services/event-service";
import type { Model, Provider } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { PackageOpen, Trash2 } from "lucide-react";
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
import { LdrsLoader } from "../ldrs-loader";
import { AddModelModal } from "./add-model-modal";
import { ClearModelsModal } from "./clear-models-modal";
import { EditModelModal } from "./edit-model-modal";
import { RowList } from "./row-list";

interface ModelListProps {
  onFetchModels?: () => void;
  isFetchingModels?: boolean;
  isFormValid?: boolean;
}

export function ModelList({
  onFetchModels,
  isFetchingModels = false,
  isFormValid = false,
}: ModelListProps) {
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

  const [containerHeight, setContainerHeight] = useState(300);

  const [tabKey] = useState<React.Key>("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);

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

  const filteredModels = useMemo(() => {
    let models = baseModels;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      models = baseModels.filter((model) =>
        (model.remark || model.name).toLowerCase().includes(query),
      );
    }

    return models.sort((a, b) =>
      (a.remark || a.name).localeCompare(b.remark || b.name),
    );
  }, [baseModels, searchQuery]);

  const listData = useMemo(
    () => ({
      models: filteredModels,
      providersMap,
    }),
    [filteredModels, providersMap],
  );

  const updateHeight = useCallback(() => {
    if (!containerRef.current) return;

    // 直接获取容器在视口中的位置
    const rect = containerRef.current.getBoundingClientRect();

    // 计算可用高度：视口高度 - 容器顶部位置 - 底部间距
    const availableHeight = window.innerHeight - rect.top - 16;

    const newHeight = Math.max(availableHeight, 300);

    if (Math.abs(containerHeight - newHeight) > 5) {
      setContainerHeight(newHeight);
    }
  }, [containerHeight]);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node) {
      const rect = node.getBoundingClientRect();
      const availableHeight = window.innerHeight - rect.top - 8;
      setContainerHeight(availableHeight);
    }
  }, []);

  useLayoutEffect(() => {
    updateHeight();
  }, [updateHeight]);

  useEffect(() => {
    updateHeight();

    const handleResize = () => requestAnimationFrame(updateHeight);
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateHeight);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [updateHeight]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <ignore>
  useEffect(() => {
    requestAnimationFrame(updateHeight);
  }, [filteredModels.length, updateHeight]);

  useEffect(() => {
    if (!providersFetching && !modelsFetching) {
      startTransition(() => {
        setReady(true);
      });
    }
  }, [providersFetching, modelsFetching]);

  useEffect(() => {
    const unsubscribe = emitter.on(EventNames.MODEL_EDIT, ({ model }) => {
      setEditingModel(model);
      setIsEditModalOpen(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loading = !ready || isPending;

  const handleClear = () => {
    setIsClearModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        {/* <ModelFilter onTabChange={setTabKey} /> */}
        <div className="flex gap-2">
          <Button
            onClick={onFetchModels}
            intent="primary"
            isDisabled={!onFetchModels || !isFormValid}
            isPending={isFetchingModels}
            className="h-10 min-w-[110px] rounded-lg"
          >
            {({ isPending }) => (
              <>
                {isPending && <LdrsLoader type="line-spinner" size={16} />}
                {t("fetch-models")}
              </>
            )}
          </Button>

          <Button
            className="inset-ring-primary h-10 min-w-[110px] rounded-lg pressed:bg-accent text-primary hover:bg-accent"
            onClick={() => setIsAddModelModalOpen(true)}
            intent="outline"
          >
            {t("add-model")}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <SearchField
            className="[&_[role=group]]:inset-ring-transparent [&_[role=group]]:h-[40px] [&_[role=group]]:bg-setting [&_[role=group]]:shadow-none [&_[role=group]]:focus-within:inset-ring-transparent [&_[role=group]]:hover:inset-ring-transparent [&_input]:text-setting-fg"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("search-placeholder")}
          />

          <Button
            onClick={handleClear}
            intent="plain"
            isDisabled={!selectedProvider?.id || filteredModels.length === 0}
            className="h-10 min-w-[78px] rounded-lg bg-danger-2 pressed:bg-danger-2/70 text-danger-fg-2 hover:bg-danger-2/70"
          >
            <Trash2 className="size-4" />
            {t("clear-models")}
          </Button>
        </div>
      </div>
      <div
        ref={setContainerRef}
        className="mb-4 flex h-full min-h-[300px] flex-col overflow-hidden rounded-xl border"
      >
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: containerHeight }}
          >
            <LdrsLoader type="waveform" />
          </div>
        ) : (
          <div className=" w-full min-w-full flex-1 caption-bottom text-sm outline-hidden">
            <div className="!bg-muted mb-1 grid h-10 grid-cols-[minmax(0,1fr)_180px_50px] text-muted-fg">
              <div className="flex h-full items-center pl-4 outline-hidden">
                <div className="truncate">{t("model-name")}</div>
              </div>
              {/* TODO: add model type
              <div className="flex h-full items-center outline-hidden">
                <div className="truncate">模型类型</div>
              </div> */}

              <div className="flex h-full items-center outline-hidden">
                <div className="truncate">{t("model-capabilities")}</div>
              </div>

              <div className="flex h-full items-center outline-hidden">
                <div className="truncate">{t("actions")}</div>
              </div>
            </div>
            {filteredModels.length > 0 ? (
              <List
                height={containerHeight - 50}
                itemCount={filteredModels.length}
                itemSize={50}
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
              <div className="-translate-y-10 flex h-full items-center justify-center text-muted-fg">
                <div className="flex flex-col items-center gap-2">
                  <PackageOpen className="size-9" />
                  <p>{t("no-models-description")}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddModelModal
        isOpen={isAddModelModalOpen}
        onOpenChange={setIsAddModelModalOpen}
      />

      <ClearModelsModal
        isOpen={isClearModalOpen}
        onOpenChange={setIsClearModalOpen}
        providerId={selectedProvider?.id}
      />

      <EditModelModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        model={editingModel}
      />
    </>
  );
}
