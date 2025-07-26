import { triplitClient } from "@renderer/client";
import type { OrderableQueries } from "../types";

/**
 * Tabs 集合的标准查询定义
 */
export const tabsQueries: OrderableQueries<"tabs"> & {
  /** 根据类型获取tabs */
  byType: (
    type: import("@shared/triplit/types").TabType,
  ) => ReturnType<typeof triplitClient.query<"tabs">>;
} = {
  /**
   * 获取所有 tabs 记录
   */
  all: () => triplitClient.query("tabs"),

  /**
   * 获取按顺序排列的 tabs
   */
  ordered: () => triplitClient.query("tabs").Order("order", "ASC"),

  /**
   * 根据ID获取单个 tab
   */
  byId: (id: string) => triplitClient.query("tabs").Id(id),

  /**
   * 根据类型获取 tabs
   */
  byType: (type) => triplitClient.query("tabs").Where("type", "=", type),
} as const;
