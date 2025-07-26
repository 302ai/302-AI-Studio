import { triplitClient } from "@renderer/client";
import type { OrderableQueries } from "../types";

/**
 * Toolbox 集合的标准查询定义
 */
export const toolboxQueries: OrderableQueries<"toolbox"> & {
  /** 获取已收藏的tools */
  collected: () => ReturnType<typeof triplitClient.query<"toolbox">>;
} = {
  /**
   * 获取所有 toolbox 记录
   */
  all: () => triplitClient.query("toolbox"),

  /**
   * 获取按创建时间排序的 toolbox 记录
   */
  ordered: () => triplitClient.query("toolbox").Order("createdAt", "DESC"),

  /**
   * 根据ID获取单个 tool
   */
  byId: (id: string) => triplitClient.query("toolbox").Id(id),

  /**
   * 获取已收藏的 tools
   */
  collected: () => triplitClient.query("toolbox").Where("collected", "=", true),
} as const;
