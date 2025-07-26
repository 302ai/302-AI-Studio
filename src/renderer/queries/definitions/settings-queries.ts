import { triplitClient } from "@renderer/client";
import type { BaseQueries } from "../types";

/**
 * Settings 集合的标准查询定义
 */
export const settingsQueries: BaseQueries<"settings"> & {
  /** 获取第一个(主要的)settings记录 */
  first: () => ReturnType<typeof triplitClient.query<"settings">>;
} = {
  /**
   * 获取所有 settings 记录
   */
  all: () => triplitClient.query("settings"),

  /**
   * 根据ID获取单个 settings 记录
   */
  byId: (id: string) => triplitClient.query("settings").Id(id),

  /**
   * 获取第一个(主要的)settings记录
   */
  first: () => triplitClient.query("settings").Limit(1),
} as const;
