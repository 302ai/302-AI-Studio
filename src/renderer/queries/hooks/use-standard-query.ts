import { triplitClient } from "@renderer/client";
import { useQuery, useQueryOne } from "@triplit/react";
import { useCallback } from "react";
import type {
  CollectionName,
  QueryConfig,
  QueryData,
  QueryDataSingle,
  QueryOneConfig,
  QueryResult,
} from "../types";

/**
 * 基础查询Hook - 支持多条记录查询
 */
export function useStandardQuery<
  T extends CollectionName,
  TSelect = QueryData<T>,
>(
  queryFn: () => ReturnType<typeof triplitClient.query<T>>,
  options: QueryConfig<T, TSelect> = {},
): QueryResult<TSelect> {
  const { enabled = true, select } = options;

  // 根据enabled状态决定是否执行查询
  const query = enabled ? queryFn() : null;

  // 使用 Triplit 的 useQuery hook
  const { results, fetching, error } = useQuery(
    triplitClient,
    // @ts-ignore - Triplit 的类型系统对于条件查询支持不够好
    query,
  );

  // 转换数据
  const transformedData = (() => {
    if (!enabled || !results) return undefined;
    const rawData = Array.from(results.values()) as QueryData<T>;
    return select ? select(rawData) : (rawData as TSelect);
  })();

  // 手动重新获取函数（Triplit会自动处理数据同步）
  const refetch = useCallback(async () => {
    // Triplit 自动处理数据同步，这里只是为了API兼容性
    console.log("Triplit handles data synchronization automatically");
  }, []);

  return {
    data: transformedData as TSelect,
    isLoading: enabled && fetching && transformedData === undefined,
    isFetching: enabled && fetching,
    error: enabled ? error || null : null,
    refetch,
  };
}

/**
 * 单条记录查询Hook - 支持单条记录查询
 */
export function useStandardQueryOne<
  T extends CollectionName,
  TSelect = QueryDataSingle<T>,
>(
  queryFn: () => ReturnType<typeof triplitClient.query<T>>,
  options: QueryOneConfig<T, TSelect> = {},
): QueryResult<TSelect> {
  const { enabled = true, select } = options;

  // 根据enabled状态决定是否执行查询
  const query = enabled ? queryFn() : null;

  // 使用 Triplit 的 useQueryOne hook
  const { result, fetching, error } = useQueryOne(
    triplitClient,
    // @ts-ignore - Triplit 的类型系统对于条件查询支持不够好
    query,
  );

  // 转换数据
  const transformedData = (() => {
    if (!enabled || result === undefined) return undefined;
    const rawData = result as QueryDataSingle<T>;
    return select ? select(rawData) : (rawData as TSelect);
  })();

  // 手动重新获取函数（Triplit会自动处理数据同步）
  const refetch = useCallback(async () => {
    // Triplit 自动处理数据同步，这里只是为了API兼容性
    console.log("Triplit handles data synchronization automatically");
  }, []);

  return {
    data: transformedData as TSelect,
    isLoading: enabled && fetching && transformedData === undefined,
    isFetching: enabled && fetching,
    error: enabled ? error || null : null,
    refetch,
  };
}
