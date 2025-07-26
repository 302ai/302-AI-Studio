import type { Thread } from "@shared/triplit/types";

import { threadsQueries } from "../definitions/threads-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有threads记录
 */
export function useThreads(
  config?: QueryConfig<"threads">,
): QueryResult<Thread[]> {
  return useStandardQuery(threadsQueries.all, config);
}

/**
 * 获取按创建时间倒序排列的threads
 */
export function useOrderedThreads(
  config?: QueryConfig<"threads">,
): QueryResult<Thread[]> {
  return useStandardQuery(threadsQueries.ordered, config);
}

/**
 * 获取非私有threads，按创建时间倒序
 */
export function useNonPrivateThreads(
  config?: QueryConfig<"threads">,
): QueryResult<Thread[]> {
  return useStandardQuery(threadsQueries.nonPrivateByDate, config);
}

/**
 * 根据ID获取单个thread
 */
export function useThread(
  id: string,
  config?: QueryOneConfig<"threads">,
): QueryResult<Thread | null> {
  return useStandardQueryOne(() => threadsQueries.byId(id), {
    ...config,
    enabled: !!id && config?.enabled !== false,
  });
}

/**
 * 根据隐私状态获取threads
 */
export function useThreadsByPrivacy(
  isPrivate: boolean,
  config?: QueryConfig<"threads">,
): QueryResult<Thread[]> {
  return useStandardQuery(() => threadsQueries.byPrivacy(isPrivate), config);
}
