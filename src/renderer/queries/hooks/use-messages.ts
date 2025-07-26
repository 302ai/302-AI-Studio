import type { Message } from "@shared/triplit/types";

import { messagesQueries } from "../definitions/messages-queries";
import type { QueryConfig, QueryOneConfig, QueryResult } from "../types";
import { useStandardQuery, useStandardQueryOne } from "./use-standard-query";

/**
 * 获取所有messages记录
 */
export function useMessages(
  config?: QueryConfig<"messages">,
): QueryResult<Message[]> {
  return useStandardQuery(messagesQueries.all, config);
}

/**
 * 获取按创建时间排序的messages
 */
export function useOrderedMessages(
  config?: QueryConfig<"messages">,
): QueryResult<Message[]> {
  return useStandardQuery(messagesQueries.ordered, config);
}

/**
 * 根据ID获取单个message
 */
export function useMessage(
  id: string,
  config?: QueryOneConfig<"messages">,
): QueryResult<Message | null> {
  return useStandardQueryOne(() => messagesQueries.byId(id), {
    ...config,
    enabled: !!id && config?.enabled !== false,
  });
}

/**
 * 根据thread ID获取messages
 */
export function useMessagesByThread(
  threadId: string,
  config?: QueryConfig<"messages">,
): QueryResult<Message[]> {
  return useStandardQuery(() => messagesQueries.byThread(threadId), {
    ...config,
    enabled: !!threadId && config?.enabled !== false,
  });
}

/**
 * 根据thread ID获取messages，按顺序排列
 */
export function useOrderedMessagesByThread(
  threadId: string,
  config?: QueryConfig<"messages">,
): QueryResult<Message[]> {
  return useStandardQuery(() => messagesQueries.byThreadOrdered(threadId), {
    ...config,
    enabled: !!threadId && config?.enabled !== false,
  });
}
