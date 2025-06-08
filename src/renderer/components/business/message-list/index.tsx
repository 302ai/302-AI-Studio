import { useActiveThread } from "@renderer/hooks/use-active-thread";
import { useStreamChat } from "@renderer/hooks/use-stream-chat";
import { triplitClient } from "@shared/triplit/client";
import type { Message } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

export function MessageList() {
  const { activeThreadId } = useActiveThread();
  const { streamingMessages } = useStreamChat();
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
      msg => msg.threadId === activeThreadId
    );

    // Combine database messages with streaming messages
    return [
      ...dbMessages,
      ...streamingMessagesForThread.map(streamMsg => ({
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
      }))
    ].sort((a, b) => a.orderSeq - b.orderSeq);
  }, [messages, streamingMessages, activeThreadId]);

  // 自动滚动到底部的函数
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, []);

  // 检查是否应该自动滚动（用户是否在底部附近）
  const shouldAutoScroll = useCallback(() => {
    if (!scrollContainerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    // 如果用户在距离底部50px以内，就认为应该自动滚动
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  // 当消息列表发生变化时，自动滚动到底部
  useEffect(() => {
    if (messagesList.length > 0) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      const timeoutId = setTimeout(() => {
        if (shouldAutoScroll()) {
          scrollToBottom();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [messagesList.length, shouldAutoScroll, scrollToBottom]);

  // 当切换线程时，立即滚动到底部
  useEffect(() => {
    if (activeThreadId && messagesList.length > 0) {
      setTimeout(scrollToBottom, 150);
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
              <AssistantMessage message={message} />
            )}
          </div>
        ))}
        {/* 滚动锚点 */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
}
