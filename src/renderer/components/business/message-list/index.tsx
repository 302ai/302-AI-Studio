import { useActiveThread } from "@renderer/hooks/use-active-thread";
import { useStreamChat } from "@renderer/hooks/use-stream-chat";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { triplitClient } from "@shared/triplit/client";
import type { Message } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

export function MessageList() {
  const { activeThreadId } = useActiveThread();
  const { streamingMessages, isStreaming } = useStreamChat();
  const { handleRefreshMessage } = useToolBar();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 查询当前线程的消息
  const messagesQuery = useMemo(() => {
    if (!activeThreadId) return null;
    return triplitClient
      .query("messages")
      .Where("threadId", "=", activeThreadId)
      .Order("orderSeq", "ASC");
  }, [activeThreadId]);

  const { results: messages } = useQuery(
    triplitClient,
    messagesQuery ||
      triplitClient.query("messages").Where("id", "=", "non-existent"),
  );

  const messagesList = useMemo(() => {
    const dbMessages = messages || [];
    const streamingMessagesForThread = streamingMessages.filter(
      (msg) => msg.threadId === activeThreadId,
    );

    // Create a map to track which messages are being regenerated
    const regeneratingMessageIds = new Set(
      streamingMessagesForThread
        .filter((msg) => msg.id.startsWith("temp-regenerate-"))
        .map((msg) => msg.id.replace("temp-regenerate-", "")),
    );

    // Filter out database messages that are currently being regenerated
    const filteredDbMessages = dbMessages.filter(
      (msg) => !regeneratingMessageIds.has(msg.id),
    );

    // Combine filtered database messages with streaming messages
    const result = [
      ...filteredDbMessages,
      ...streamingMessagesForThread.map((streamMsg) => ({
        id: streamMsg.id,
        threadId: streamMsg.threadId,
        parentMessageId: streamMsg.parentMessageId,
        role: streamMsg.role,
        content: streamMsg.content,
        attachments: null,
        createdAt: new Date(),
        orderSeq: streamMsg.orderSeq,
        tokenCount: streamMsg.content.length,
        status: streamMsg.status,
      })),
    ].sort((a, b) => a.orderSeq - b.orderSeq);

    return result;
  }, [messages, streamingMessages, activeThreadId]);

  // 自动滚动到底部的函数
  const scrollToBottom = useCallback((instant = false) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (instant) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, []);

  // 检查是否应该自动滚动（用户是否在底部附近）
  const shouldAutoScroll = useCallback(() => {
    if (!scrollContainerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    // 如果用户在距离底部100px以内，就认为应该自动滚动
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // 监听消息列表变化（包括流式消息内容变化），实时滚动到底部
  useLayoutEffect(() => {
    if (messagesList.length > 0) {
      // 使用双重 requestAnimationFrame 确保 DOM 完全更新后再滚动
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (shouldAutoScroll()) {
            scrollToBottom(isStreaming); // 流式输出时使用瞬时滚动
          }
        });
      });

      return () => cancelAnimationFrame(rafId);
    }

    return undefined;
  }, [messagesList, isStreaming, shouldAutoScroll, scrollToBottom]);

  useEffect(() => {
    if (activeThreadId && messagesList.length > 0) {
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    }
  }, [activeThreadId, messagesList.length, scrollToBottom]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messagesList.map((message: Message) => (
          <div key={message.id}>
            {message.role === "user" ? (
              <UserMessage message={message} />
            ) : (
              <AssistantMessage
                message={message}
                handleRefreshMessage={handleRefreshMessage}
              />
            )}
          </div>
        ))}
        {/* 滚动锚点 */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
}
