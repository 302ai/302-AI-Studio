import type { Model } from "@shared/triplit/types";

import { modelsQueries } from "../definitions/models-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有models记录
 */
export function useModels(
  config?: QueryConfig<"models">,
): QueryResult<Model[]> {
  return useStandardQuery(modelsQueries.all, config);
}

/**
 * 获取启用的models
 */
export function useEnabledModels(
  config?: QueryConfig<"models">,
): QueryResult<Model[]> {
  return useStandardQuery(modelsQueries.enabled, config);
}

/**
 * 获取启用且按收藏和名称排序的models
 */
export function useEnabledSortedModels(
  config?: QueryConfig<"models">,
): QueryResult<Model[]> {
  return useStandardQuery(modelsQueries.enabledSorted, config);
}

/**
 * 根据provider ID获取models
 */
export function useModelsByProvider(
  providerId: string,
  config?: QueryConfig<"models">,
): QueryResult<Model[]> {
  return useStandardQuery(() => modelsQueries.byProvider(providerId), {
    ...config,
    enabled: !!providerId && config?.enabled !== false,
  });
}

/**
 * 根据ID获取单个model
 */
export function useModel(
  id: string,
  config?: QueryOneConfig<"models">,
): QueryResult<Model | null> {
  return useStandardQueryOne(() => modelsQueries.byId(id), {
    ...config,
    enabled: !!id && config?.enabled !== false,
  });
}

/**
 * 根据ID获取model，包含provider信息
 */
export function useModelWithProvider(
  modelId: string,
  config?: QueryOneConfig<"models">,
): QueryResult<Model | null> {
  return useStandardQueryOne(() => modelsQueries.withProvider(modelId), {
    ...config,
    enabled: !!modelId && config?.enabled !== false,
  });
}
