import { triplitClient } from "@renderer/client";
import type { FullQueries } from "../types";

/**
 * Models 集合的标准查询定义
 */
export const modelsQueries: FullQueries<"models"> & {
  /** 获取启用且按收藏和名称排序的models */
  enabledSorted: () => ReturnType<typeof triplitClient.query<"models">>;
  /** 根据provider ID获取models */
  byProvider: (
    providerId: string,
  ) => ReturnType<typeof triplitClient.query<"models">>;
  /** 根据ID获取单个model，包含provider信息 */
  withProvider: (
    modelId: string,
  ) => ReturnType<typeof triplitClient.query<"models">>;
} = {
  /**
   * 获取所有 models 记录
   */
  all: () => triplitClient.query("models"),

  /**
   * 获取启用的 models
   */
  enabled: () => triplitClient.query("models").Where("enabled", "=", true),

  /**
   * 获取按名称排序的 models
   */
  ordered: () => triplitClient.query("models").Order("name", "ASC"),

  /**
   * 获取启用且按收藏状态和名称排序的 models
   */
  enabledSorted: () =>
    triplitClient
      .query("models")
      .Where("enabled", "=", true)
      .Order("collected", "DESC")
      .Order("name", "ASC"),

  /**
   * 根据provider ID获取 models
   */
  byProvider: (providerId: string) =>
    triplitClient.query("models").Where("providerId", "=", providerId),

  /**
   * 根据ID获取单个 model，包含provider信息
   */
  withProvider: (modelId: string) =>
    triplitClient.query("models").Where("id", "=", modelId).Include("provider"),

  /**
   * 根据ID获取单个 model
   */
  byId: (id: string) => triplitClient.query("models").Id(id),
} as const;
