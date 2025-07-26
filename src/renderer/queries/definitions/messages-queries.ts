import { triplitClient } from "@renderer/client";
import type { OrderableQueries } from "../types";

/**
 * Messages 集合的标准查询定义
 */
export const messagesQueries: OrderableQueries<"messages"> & {
  /** 根据thread ID获取messages */
  byThread: (
    threadId: string,
  ) => ReturnType<typeof triplitClient.query<"messages">>;
  /** 根据thread ID获取messages，按顺序排列 */
  byThreadOrdered: (
    threadId: string,
  ) => ReturnType<typeof triplitClient.query<"messages">>;
} = {
  /**
   * 获取所有 messages 记录
   */
  all: () => triplitClient.query("messages"),

  /**
   * 获取按创建时间排序的 messages
   */
  ordered: () => triplitClient.query("messages").Order("createdAt", "ASC"),

  /**
   * 根据ID获取单个 message
   */
  byId: (id: string) => triplitClient.query("messages").Id(id),

  /**
   * 根据thread ID获取 messages
   */
  byThread: (threadId: string) =>
    triplitClient.query("messages").Where("threadId", "=", threadId),

  /**
   * 根据thread ID获取 messages，按顺序排列
   */
  byThreadOrdered: (threadId: string) =>
    triplitClient
      .query("messages")
      .Where("threadId", "=", threadId)
      .Order("orderSeq", "ASC"),
} as const;
