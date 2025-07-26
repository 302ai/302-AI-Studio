import type { Model } from "@shared/triplit/types";
import { useMemo } from "react";
import type { QueryConfig, QueryOneConfig } from "../../types";
import {
  useEnabledOrderedProviders,
  useEnabledSortedModels,
  useSettingsOne,
  useUIState,
} from "../index";

/**
 * 聊天上下文组合Hook
 * 聚合聊天相关的所有基础数据
 */
export function useChatContext(config?: {
  settings?: QueryOneConfig<"settings">;
  providers?: QueryConfig<"providers">;
  models?: QueryConfig<"models">;
  ui?: QueryConfig<"ui">;
}) {
  // 获取基础数据
  const { data: settingsData, isLoading: settingsLoading } = useSettingsOne(
    config?.settings,
  );
  const { data: providersData, isLoading: providersLoading } =
    useEnabledOrderedProviders(config?.providers);
  const { data: modelsData, isLoading: modelsLoading } = useEnabledSortedModels(
    config?.models,
  );
  const { data: uiData, isLoading: uiLoading } = useUIState(config?.ui);

  // 计算聚合数据
  const aggregatedData = useMemo(() => {
    const settings = settingsData;
    const providers = providersData || [];
    const models = modelsData || [];
    const ui = uiData;

    // 获取当前选中的provider
    const selectedProvider =
      providers.find((p) => p.id === ui?.activeProviderId) ||
      providers[0] ||
      null;

    // 获取当前选中的model
    const selectedModelId = settings?.selectedModelId || "";
    const selectedModel = models.find((m) => m.id === selectedModelId) || null;

    // 获取新聊天模型ID（可能是"use-last-model"或具体模型ID）
    const newChatModelId = settings?.newChatModelId || "use-last-model";
    let newChatModel: Model | null = null;

    if (newChatModelId === "use-last-model") {
      newChatModel = selectedModel;
    } else {
      newChatModel = models.find((m) => m.id === newChatModelId) || null;
    }

    return {
      // 原始数据
      settings,
      providers,
      models,
      ui,

      // 聚合数据
      selectedProvider,
      selectedModel,
      newChatModel,

      // 便捷访问
      theme: settings?.theme || "system",
      language: settings?.language || "zh",
      isPrivate: settings?.isPrivate || false,
      activeThreadId: ui?.activeThreadId || null,
      activeTabId: ui?.activeTabId || null,
    };
  }, [settingsData, providersData, modelsData, uiData]);

  return {
    ...aggregatedData,
    isLoading:
      settingsLoading || providersLoading || modelsLoading || uiLoading,
    isReady: !!(
      settingsData &&
      providersData &&
      modelsData &&
      uiData !== undefined
    ),
  };
}
