import { triplitClient } from "@renderer/client";
import type { OrderableQueries } from "../types";

/**
 * Threads 集合的标准查询定义
 */
export const threadsQueries: OrderableQueries<"threads"> & {
  /** 获取非私有threads，按创建时间倒序 */
  nonPrivateByDate: () => ReturnType<typeof triplitClient.query<"threads">>;
  /** 根据隐私状态获取threads */
  byPrivacy: (
    isPrivate: boolean,
  ) => ReturnType<typeof triplitClient.query<"threads">>;
} = {
  /**
   * 获取所有 threads 记录
   */
  all: () => triplitClient.query("threads"),

  /**
   * 获取按创建时间倒序排列的 threads
   */
  ordered: () => triplitClient.query("threads").Order("createdAt", "DESC"),

  /**
   * 根据ID获取单个 thread
   */
  byId: (id: string) => triplitClient.query("threads").Id(id),

  /**
   * 获取非私有threads，按创建时间倒序
   */
  nonPrivateByDate: () =>
    triplitClient
      .query("threads")
      .Where("isPrivate", "=", false)
      .Order("createdAt", "DESC"),

  /**
   * 根据隐私状态获取threads
   */
  byPrivacy: (isPrivate: boolean) =>
    triplitClient.query("threads").Where("isPrivate", "=", isPrivate),
} as const;
