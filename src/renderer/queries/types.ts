import type { triplitClient } from "@renderer/client";

import type { Schema } from "@shared/triplit/schema";
import type { Entity } from "@triplit/client";

// 基于现有Schema的查询构建器类型
export type QueryBuilder<T extends keyof Schema> = ReturnType<
  typeof triplitClient.query<T>
>;

// 查询结果数据类型
export type QueryData<T extends keyof Schema> = Entity<Schema, T>[];
export type QueryDataSingle<T extends keyof Schema> = Entity<Schema, T> | null;

// 查询配置选项
export interface QueryConfig<T extends keyof Schema, TSelect = QueryData<T>> {
  /** 是否启用查询，默认为 true */
  enabled?: boolean;
  /** 数据选择器，用于转换查询结果 */
  select?: (data: QueryData<T>) => TSelect;
}

// 单条记录查询配置
export interface QueryOneConfig<
  T extends keyof Schema,
  TSelect = QueryDataSingle<T>,
> {
  /** 是否启用查询，默认为 true */
  enabled?: boolean;
  /** 数据选择器，用于转换查询结果 */
  select?: (data: QueryDataSingle<T>) => TSelect;
}

// 统一的查询结果类型
export interface QueryResult<TData = unknown> {
  /** 查询返回的数据 */
  data: TData;
  /** 是否正在加载中 */
  isLoading: boolean;
  /** 是否正在获取数据（包括后台刷新） */
  isFetching: boolean;
  /** 查询错误信息，如果没有错误则为 null */
  error: Error | null;
  /** 手动重新获取数据 */
  refetch: () => Promise<void>;
}

// 集合名称类型
export type CollectionName = keyof Schema;

// 查询过滤器类型辅助
export type QueryFilter<T extends CollectionName> = {
  [K in keyof Entity<Schema, T>]?:
    | Entity<Schema, T>[K]
    | ((value: Entity<Schema, T>[K]) => boolean);
};

// 查询排序类型辅助
export type QuerySort<T extends CollectionName> = {
  [K in keyof Entity<Schema, T>]?: "ASC" | "DESC";
};

// 预定义的查询变体类型 - 基础接口
export interface BaseQueries<T extends CollectionName> {
  /** 获取所有记录 */
  all: () => QueryBuilder<T>;
  /** 根据ID获取单条记录 */
  byId: (id: string) => QueryBuilder<T>;
}

// 支持排序的查询接口
export interface OrderableQueries<T extends CollectionName>
  extends BaseQueries<T> {
  /** 获取排序后的记录 */
  ordered: () => QueryBuilder<T>;
}

// 支持过滤的查询接口
export interface FilterableQueries<T extends CollectionName>
  extends BaseQueries<T> {
  /** 获取启用的记录 */
  enabled: () => QueryBuilder<T>;
}

// 支持排序和过滤的完整查询接口
export interface FullQueries<T extends CollectionName> extends BaseQueries<T> {
  /** 获取启用的记录 */
  enabled: () => QueryBuilder<T>;
  /** 获取排序后的记录 */
  ordered: () => QueryBuilder<T>;
}
