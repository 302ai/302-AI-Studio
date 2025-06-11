import { ChatInput } from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";
import { useActiveThread } from "@renderer/hooks/use-active-thread";
import { useStreamChat } from "@renderer/hooks/use-stream-chat";
import { triplitClient } from "@shared/triplit/client";
import { useQuery } from "@triplit/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

export function ChatPage() {
  const { activeThreadId } = useActiveThread();
  const { streamingMessages, isStreaming } = useStreamChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = useCallback((instant = false) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (instant) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, []);

  const shouldAutoScroll = useCallback(() => {
    if (!scrollContainerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  useLayoutEffect(() => {
    if (messagesList.length > 0) {
      const rafId = requestAnimationFrame(() => {
        if (shouldAutoScroll()) {
          scrollToBottom(isStreaming);
        }
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
    <div className="flex size-full flex-col p-6 pr-0">
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto pr-6"
      >
        <MessageList messages={messagesList} />
      </div>

      <div className="flex-shrink-0 pt-4 pr-6">
        <ChatInput />
      </div>
    </div>
  );
}
