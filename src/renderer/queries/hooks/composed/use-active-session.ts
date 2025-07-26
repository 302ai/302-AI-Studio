import { useMemo } from "react";
import type { QueryConfig, QueryOneConfig } from "../../types";
import {
  useActiveTabId,
  useActiveThreadId,
  useOrderedMessagesByThread,
  useTab,
  useThread,
} from "../index";

/**
 * 活跃会话组合Hook
 * 聚合当前活跃的线程、标签和消息数据
 */
export function useActiveSession(config?: {
  ui?: QueryConfig<"ui">;
  thread?: QueryOneConfig<"threads">;
  tab?: QueryOneConfig<"tabs">;
  messages?: QueryConfig<"messages">;
}) {
  // 获取活跃的IDs
  const { data: activeThreadId } = useActiveThreadId(config?.ui);
  const { data: activeTabId } = useActiveTabId(config?.ui);

  // 获取活跃的实体
  const { data: activeThread, isLoading: threadLoading } = useThread(
    activeThreadId || "",
    { ...config?.thread, enabled: !!activeThreadId },
  );

  const { data: activeTab, isLoading: tabLoading } = useTab(activeTabId || "", {
    ...config?.tab,
    enabled: !!activeTabId,
  });

  // 获取活跃线程的消息
  const { data: messages, isLoading: messagesLoading } =
    useOrderedMessagesByThread(activeThreadId || "", {
      ...config?.messages,
      enabled: !!activeThreadId,
    });

  // 计算聚合状态
  const sessionState = useMemo(() => {
    const hasActiveThread = !!activeThread;
    const hasActiveTab = !!activeTab;
    const hasMessages = messages && messages.length > 0;
    const isNewSession = hasActiveTab && !hasActiveThread;
    const isSessionStarted = hasMessages;

    return {
      // 基础数据
      activeThreadId,
      activeTabId,
      activeThread,
      activeTab,
      messages: messages || [],

      // 状态标识
      hasActiveThread,
      hasActiveTab,
      hasMessages,
      isNewSession,
      isSessionStarted,

      // 便捷访问
      threadTitle: activeThread?.title || "",
      tabTitle: activeTab?.title || "",
      isPrivate: activeThread?.isPrivate || activeTab?.isPrivate || false,
      modelId: activeThread?.modelId || "",
      providerId: activeThread?.providerId || "",

      // 消息统计
      messageCount: messages?.length || 0,
      lastMessage:
        messages && messages.length > 0 ? messages[messages.length - 1] : null,
      userMessageCount: messages?.filter((m) => m.role === "user").length || 0,
      assistantMessageCount:
        messages?.filter((m) => m.role === "assistant").length || 0,
    };
  }, [activeThreadId, activeTabId, activeThread, activeTab, messages]);

  const isLoading = threadLoading || tabLoading || messagesLoading;
  const isReady =
    !isLoading && (sessionState.hasActiveTab || sessionState.hasActiveThread);

  return {
    ...sessionState,
    isLoading,
    isReady,
  };
}
