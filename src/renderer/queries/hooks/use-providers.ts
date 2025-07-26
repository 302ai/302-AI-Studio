import type { Provider } from "@shared/triplit/types";

import { providersQueries } from "../definitions/providers-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有providers记录
 */
export function useProviders(
  config?: QueryConfig<"providers">,
): QueryResult<Provider[]> {
  return useStandardQuery(providersQueries.all, config);
}

/**
 * 获取启用的providers
 */
export function useEnabledProviders(
  config?: QueryConfig<"providers">,
): QueryResult<Provider[]> {
  return useStandardQuery(providersQueries.enabled, config);
}

/**
 * 获取按顺序排列的providers
 */
export function useOrderedProviders(
  config?: QueryConfig<"providers">,
): QueryResult<Provider[]> {
  return useStandardQuery(providersQueries.ordered, config);
}

/**
 * 获取启用且按顺序排列的providers
 */
export function useEnabledOrderedProviders(
  config?: QueryConfig<"providers">,
): QueryResult<Provider[]> {
  return useStandardQuery(providersQueries.enabledOrdered, config);
}

/**
 * 根据ID获取单个provider
 */
export function useProvider(
  id: string,
  config?: QueryOneConfig<"providers">,
): QueryResult<Provider | null> {
  return useStandardQueryOne(() => providersQueries.byId(id), config);
}

/**
 * 获取第一个可用的provider
 */
export function useFirstProvider(config?: QueryConfig<"providers">) {
  return useStandardQuery(providersQueries.enabledOrdered, {
    ...config,
    select: (data) => data?.[0] || null,
  });
}
