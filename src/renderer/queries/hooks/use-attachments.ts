import type { Attachment } from "@shared/triplit/types";

import { attachmentsQueries } from "../definitions/attachments-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有attachments记录
 */
export function useAttachments(
  config?: QueryConfig<"attachments">,
): QueryResult<Attachment[]> {
  return useStandardQuery(attachmentsQueries.all, config);
}

/**
 * 获取按创建时间排序的attachments
 */
export function useOrderedAttachments(
  config?: QueryConfig<"attachments">,
): QueryResult<Attachment[]> {
  return useStandardQuery(attachmentsQueries.ordered, config);
}

/**
 * 根据ID获取单个attachment
 */
export function useAttachment(
  id: string,
  config?: QueryOneConfig<"attachments">,
): QueryResult<Attachment | null> {
  return useStandardQueryOne(() => attachmentsQueries.byId(id), {
    ...config,
    enabled: !!id && config?.enabled !== false,
  });
}

/**
 * 根据message ID获取attachments
 */
export function useAttachmentsByMessage(
  messageId: string,
  config?: QueryConfig<"attachments">,
): QueryResult<Attachment[]> {
  return useStandardQuery(() => attachmentsQueries.byMessage(messageId), {
    ...config,
    enabled: !!messageId && config?.enabled !== false,
  });
}
