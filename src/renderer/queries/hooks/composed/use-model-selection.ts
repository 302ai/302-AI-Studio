import type { Model, Provider } from "@shared/triplit/types";
import { useMemo } from "react";
import type { QueryConfig } from "../../types";
import { useEnabledOrderedProviders, useEnabledSortedModels } from "../index";

/**
 * 按Provider分组的Model数据
 */
export interface GroupedModel {
  provider: Provider;
  models: Model[];
}

/**
 * 模型选择组合Hook
 * 提供按Provider分组的Model数据，用于模型选择界面
 */
export function useModelSelection(config?: {
  providers?: QueryConfig<"providers">;
  models?: QueryConfig<"models">;
}) {
  // 获取基础数据
  const { data: providers, isLoading: providersLoading } =
    useEnabledOrderedProviders(config?.providers);
  const { data: models, isLoading: modelsLoading } = useEnabledSortedModels(
    config?.models,
  );

  // 计算分组数据
  const groupedData = useMemo(() => {
    if (!providers || !models) {
      return {
        groupedModels: [],
        modelMap: new Map<string, Model>(),
        providerMap: new Map<string, Provider>(),
      };
    }

    // 创建模型映射
    const modelMap = new Map<string, Model>();
    models.forEach((model) => {
      modelMap.set(model.id, model);
    });

    // 创建Provider映射
    const providerMap = new Map<string, Provider>();
    providers.forEach((provider) => {
      providerMap.set(provider.id, provider);
    });

    // 按Provider分组Models
    const groupedModels: GroupedModel[] = providers
      .map((provider) => ({
        provider,
        models: models.filter((model) => model.providerId === provider.id),
      }))
      .filter((group) => group.models.length > 0);

    return {
      groupedModels,
      modelMap,
      providerMap,
    };
  }, [providers, models]);

  return {
    // 原始数据
    providers: providers || [],
    models: models || [],

    // 分组数据
    ...groupedData,

    // 状态
    isLoading: providersLoading || modelsLoading,
    isReady: !!(providers && models),

    // 工具函数
    getModelsByProvider: (providerId: string) =>
      groupedData.groupedModels.find((g) => g.provider.id === providerId)
        ?.models || [],

    getProviderByModel: (modelId: string) => {
      const model = groupedData.modelMap.get(modelId);
      return model
        ? groupedData.providerMap.get(model.providerId) || null
        : null;
    },

    findModel: (modelId: string) => groupedData.modelMap.get(modelId) || null,
    findProvider: (providerId: string) =>
      groupedData.providerMap.get(providerId) || null,
  };
}
