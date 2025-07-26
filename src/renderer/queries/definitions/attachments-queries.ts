import { triplitClient } from "@renderer/client";
import type { OrderableQueries } from "../types";

/**
 * Attachments 集合的标准查询定义
 */
export const attachmentsQueries: OrderableQueries<"attachments"> & {
  /** 根据message ID获取attachments */
  byMessage: (
    messageId: string,
  ) => ReturnType<typeof triplitClient.query<"attachments">>;
} = {
  /**
   * 获取所有 attachments 记录
   */
  all: () => triplitClient.query("attachments"),

  /**
   * 获取按创建时间排序的 attachments
   */
  ordered: () => triplitClient.query("attachments").Order("createdAt", "DESC"),

  /**
   * 根据ID获取单个 attachment
   */
  byId: (id: string) => triplitClient.query("attachments").Id(id),

  /**
   * 根据message ID获取 attachments
   */
  byMessage: (messageId: string) =>
    triplitClient.query("attachments").Where("messageId", "=", messageId),
} as const;
