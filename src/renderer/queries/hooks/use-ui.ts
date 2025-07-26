import type { Ui } from "@shared/triplit/types";

import { uiQueries } from "../definitions/ui-queries";
import type { QueryConfig, QueryResult } from "../types";
import { useStandardQuery } from "./use-standard-query";

/**
 * 获取所有UI状态记录
 */
export function useUI(config?: QueryConfig<"ui">): QueryResult<Ui[]> {
  return useStandardQuery(uiQueries.all, config);
}

/**
 * 获取第一个(主要的)UI状态记录
 */
export function useUIState(config?: QueryConfig<"ui">) {
  return useStandardQuery(uiQueries.all, {
    ...config,
    select: (data) => data?.[0] || null,
  });
}

/**
 * 获取活跃的线程ID
 */
export function useActiveThreadId(config?: QueryConfig<"ui">) {
  return useStandardQuery(() => uiQueries.select(["activeThreadId"]), {
    ...config,
    select: (data) => data?.[0]?.activeThreadId || null,
  });
}

/**
 * 获取活跃的标签ID
 */
export function useActiveTabId(config?: QueryConfig<"ui">) {
  return useStandardQuery(() => uiQueries.select(["activeTabId"]), {
    ...config,
    select: (data) => data?.[0]?.activeTabId || null,
  });
}

/**
 * 获取活跃的Provider ID
 */
export function useActiveProviderId(config?: QueryConfig<"ui">) {
  return useStandardQuery(() => uiQueries.select(["activeProviderId"]), {
    ...config,
    select: (data) => data?.[0]?.activeProviderId || null,
  });
}

/**
 * 获取活跃标签历史
 */
export function useActiveTabHistory(config?: QueryConfig<"ui">) {
  return useStandardQuery(() => uiQueries.select(["activeTabHistory"]), {
    ...config,
    select: (data) => Array.from(data?.[0]?.activeTabHistory || []),
  });
}
