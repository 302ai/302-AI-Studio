import { triplitClient } from "@renderer/client";
import type { FullQueries } from "../types";

/**
 * Providers 集合的标准查询定义
 */
export const providersQueries: FullQueries<"providers"> & {
  /** 获取启用且按顺序排列的providers */
  enabledOrdered: () => ReturnType<typeof triplitClient.query<"providers">>;
} = {
  /**
   * 获取所有 providers 记录
   */
  all: () => triplitClient.query("providers"),

  /**
   * 获取启用的 providers
   */
  enabled: () => triplitClient.query("providers").Where("enabled", "=", true),

  /**
   * 获取按顺序排列的 providers
   */
  ordered: () => triplitClient.query("providers").Order("order", "ASC"),

  /**
   * 获取启用且按顺序排列的 providers
   */
  enabledOrdered: () =>
    triplitClient
      .query("providers")
      .Where("enabled", "=", true)
      .Order("order", "ASC"),

  /**
   * 根据ID获取单个 provider
   */
  byId: (id: string) => triplitClient.query("providers").Id(id),
} as const;
