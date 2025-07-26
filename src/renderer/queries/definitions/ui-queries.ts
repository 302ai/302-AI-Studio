import { triplitClient } from "@renderer/client";
import type { BaseQueries } from "../types";

/**
 * UI 集合的标准查询定义
 */
export const uiQueries: BaseQueries<"ui"> & {
  /** 获取特定字段的UI状态 */
  select: (
    fields: (keyof import("@shared/triplit/types").Ui)[],
  ) => ReturnType<typeof triplitClient.query<"ui">>;
} = {
  /**
   * 获取所有 UI 状态记录
   */
  all: () => triplitClient.query("ui"),

  /**
   * 根据ID获取单个 UI 状态记录
   */
  byId: (id: string) => triplitClient.query("ui").Id(id),

  /**
   * 获取特定字段的UI状态
   */
  select: (fields) => triplitClient.query("ui").Select(fields),
} as const;
