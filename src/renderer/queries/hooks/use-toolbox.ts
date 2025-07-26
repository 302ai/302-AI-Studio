import type { Tool } from "@shared/triplit/types";

import { toolboxQueries } from "../definitions/toolbox-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有toolbox记录
 */
export function useToolbox(
  config?: QueryConfig<"toolbox">,
): QueryResult<Tool[]> {
  return useStandardQuery(toolboxQueries.all, config);
}

/**
 * 获取按创建时间排序的toolbox记录
 */
export function useOrderedToolbox(
  config?: QueryConfig<"toolbox">,
): QueryResult<Tool[]> {
  return useStandardQuery(toolboxQueries.ordered, config);
}

/**
 * 根据ID获取单个tool
 */
export function useTool(
  id: string,
  config?: QueryOneConfig<"toolbox">,
): QueryResult<Tool | null> {
  return useStandardQueryOne(() => toolboxQueries.byId(id), {
    ...config,
    enabled: !!id && config?.enabled !== false,
  });
}

/**
 * 获取已收藏的tools
 */
export function useCollectedTools(
  config?: QueryConfig<"toolbox">,
): QueryResult<Tool[]> {
  return useStandardQuery(toolboxQueries.collected, config);
}
