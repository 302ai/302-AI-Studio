import { triplitClient } from "@renderer/client";
import { Button } from "@renderer/components/ui/button";
import { Loader } from "@renderer/components/ui/loader";
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
import { RowList } from "./row-list";

interface ModelListProps {
  onFetchModels?: () => void;
  isFetchingModels?: boolean;
}

export function ModelList({
  onFetchModels,
  isFetchingModels = false,
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

  const filteredModels = useMemo(() => {
    let models = baseModels;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      models = baseModels.filter((model) =>
        model.name.toLowerCase().includes(query),
      );
    }

    return models.sort((a, b) => a.name.localeCompare(b.name));
  }, [baseModels, searchQuery]);

  const listData = useMemo(
    () => ({
      models: filteredModels,
      providersMap, // 将 providers 映射表传递给子组件
    }),
    [filteredModels, providersMap],
  );

  // 优化后的高度计算函数
  const updateHeight = useCallback(() => {
    if (!containerRef.current) return;

    // 直接获取容器在视口中的位置
    const rect = containerRef.current.getBoundingClientRect();

    // 计算可用高度：视口高度 - 容器顶部位置 - 底部间距
    const availableHeight = window.innerHeight - rect.top - 16;

    // 确保最小高度
    const newHeight = Math.max(availableHeight, 300);

    if (Math.abs(containerHeight - newHeight) > 5) {
      setContainerHeight(newHeight);
    }
  }, [containerHeight]);

  // 使用 callback ref 确保在 DOM 挂载时立即计算高度
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node) {
      // DOM 挂载后立即计算高度
      const rect = node.getBoundingClientRect();
      const availableHeight = window.innerHeight - rect.top - 8;
      setContainerHeight(availableHeight);
    }
  }, []);

  useLayoutEffect(() => {
    // 由于使用了 callback ref，这里只需要在依赖变化时更新高度
    updateHeight();
  }, [updateHeight]);

  useEffect(() => {
    // 初始计算
    updateHeight();

    // 只监听窗口大小变化
    const handleResize = () => requestAnimationFrame(updateHeight);
    window.addEventListener("resize", handleResize);

    // 使用单个 ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateHeight);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 清理函数
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

  // 当模型列表变化时，重新计算容器高度
  // useEffect(() => {
  //   // 延迟执行以确保列表渲染完成
  //   const timer = setTimeout(updateHeight, 100);
  //   return () => clearTimeout(timer);
  // }, [filteredModels.length, updateHeight]);

  // 监听应用状态变化，确保在各种情况下都能正确更新高度
  // useEffect(() => {
  //   // 监听页面可见性变化
  //   const handleVisibilityChange = () => {
  //     if (!document.hidden) {
  //       // 页面变为可见时重新计算高度
  //       requestAnimationFrame(updateHeight);
  //     }
  //   };

  //   // 监听焦点变化
  //   const handleFocus = () => {
  //     requestAnimationFrame(updateHeight);
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   window.addEventListener("focus", handleFocus);

  //   // 定期检查高度（作为兜底机制）
  //   const intervalId = setInterval(() => {
  //     if (containerRef.current) {
  //       updateHeight();
  //     }
  //   }, 5000); // 每5秒检查一次

  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //     window.removeEventListener("focus", handleFocus);
  //     clearInterval(intervalId);
  //   };
  // }, [updateHeight]);

  const loading = !ready || isPending;

  // 检查当前选中的provider是否有baseUrl和apiKey
  const isProviderConfigValid = useMemo(() => {
    if (!selectedProvider) return false;
    return !!(
      selectedProvider.baseUrl?.trim() && selectedProvider.apiKey?.trim()
    );
  }, [selectedProvider]);

  // if (allModels.length === 0) {
  //   return null;
  // }

  return (
    <>
      <div className="flex items-center justify-between">
        {/* <ModelFilter onTabChange={setTabKey} /> */}
        <div className="flex gap-2">
          <Button
            size="extra-small"
            onClick={onFetchModels}
            isDisabled={
              isFetchingModels || !onFetchModels || !isProviderConfigValid
            }
          >
            {isFetchingModels && <Loader variant="spin" size="small" />}
            {t("fetch-models")}
          </Button>
          {/* <Button size="extra-small" intent="outline">
            添加模型
          </Button> */}
        </div>
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("search-placeholder")}
          className="!h-[40px] !w-[206px]"
          fieldGroupClassName="!border-none !shadow-none rounded-xl bg-muted focus-within:!ring-4 focus-within:!ring-ring/20 group-invalid:focus-within:!ring-danger/20"
        />
      </div>
      <div
        ref={setContainerRef}
        className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-xl border-border"
      >
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: containerHeight }}
          >
            <Fetching />
          </div>
        ) : (
          // 表头
          <div className=" w-full min-w-full flex-1 caption-bottom text-sm outline-hidden">
            <div className="!bg-muted grid h-10 grid-cols-[minmax(0,1fr)_180px_55px] text-muted-fg">
              <div className="flex h-full items-center pl-4 outline-hidden">
                <div className="truncate">{t("model-name")}</div>
              </div>
              {/*
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
