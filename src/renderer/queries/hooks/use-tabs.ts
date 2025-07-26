import type { Tab } from "@shared/triplit/types";
import { tabsQueries } from "../definitions/tabs-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有tabs记录
 */
export function useTabs(config?: QueryConfig<"tabs">): QueryResult<Tab[]> {
  return useStandardQuery(tabsQueries.all, config);
}

/**
 * 获取按顺序排列的tabs
 */
export function useOrderedTabs(
  config?: QueryConfig<"tabs">,
): QueryResult<Tab[]> {
  return useStandardQuery(tabsQueries.ordered, config);
}

/**
 * 根据ID获取单个tab
 */
export function useTab(
  id: string,
  config?: QueryOneConfig<"tabs">,
): QueryResult<Tab | null> {
  return useStandardQueryOne(() => tabsQueries.byId(id), {
    ...config,
    enabled: !!id && config?.enabled !== false,
  });
}

/**
 * 根据类型获取tabs
 */
export function useTabsByType(
  type: Tab["type"],
  config?: QueryConfig<"tabs">,
): QueryResult<Tab[]> {
  return useStandardQuery(() => tabsQueries.byType(type), {
    ...config,
    enabled: !!type && config?.enabled !== false,
  });
}
