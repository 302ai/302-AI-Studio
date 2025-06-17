/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import {
  type StreamingMessage,
  streamChatEventService,
} from "@renderer/services/stream-chat-event-service";
import type { Message, Provider } from "@shared/triplit/types";
import Logger from "electron-log";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";

const { providerService } = window.service;

export function useStreamChat() {
  const { activeTabId, activeTab } = useActiveTab();
  const { activeThreadId } = useActiveThread();
  const [streamingMessages, setStreamingMessages] = useState<
    StreamingMessage[]
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Subscribe to streaming messages changes
  useEffect(() => {
    const unsubscribe = streamChatEventService.onStreamingMessagesChange(
      (messages) => {
        setStreamingMessages(messages);
      },
    );

    // Initialize with current state
    setStreamingMessages(streamChatEventService.getStreamingMessages());

    return unsubscribe;
  }, []);

  // Subscribe to streaming state changes
  useEffect(() => {
    const unsubscribe = streamChatEventService.onStreamingStateChange(
      (isStreamingState) => {
        setIsStreaming(isStreamingState);
      },
    );

    // Initialize with current state
    setIsStreaming(streamChatEventService.getIsStreaming());

    return unsubscribe;
  }, []);

  // Convert streaming messages to unified format
  const convertedStreamingMessages = useMemo(() => {
    return streamingMessages
      .filter((msg) => msg.threadId === activeThreadId)
      .map((streamMsg) => ({
        id: streamMsg.id,
        threadId: streamMsg.threadId,
        parentMessageId: streamMsg.parentMessageId,
        role: streamMsg.role as "user" | "assistant",
        content: streamMsg.content,
        attachments: null,
        createdAt: new Date(),
        orderSeq: streamMsg.orderSeq,
        tokenCount: streamMsg.content.length,
        status: streamMsg.status,
        providerId: undefined, // streaming messages don't have providerId yet
      }));
  }, [streamingMessages, activeThreadId]);

  // Merge database messages with streaming messages intelligently
  const mergeMessages = useCallback(
    (dbMessages: Message[]) => {
      const filteredDbMessages = dbMessages || [];

      // Create a map to track which messages are being regenerated
      const regeneratingMessageIds = new Set(
        convertedStreamingMessages
          .filter((msg) => msg.id.startsWith("temp-regenerate-"))
          .map((msg) => msg.id.replace("temp-regenerate-", "")),
      );

      // Filter out database messages that are currently being regenerated
      const validDbMessages = filteredDbMessages.filter(
        (msg) => !regeneratingMessageIds.has(msg.id),
      );

      // Create a comprehensive message map for deduplication
      const messageMap = new Map<string, Message>();
      const orderSeqMap = new Map<number, Message>();

      // First pass: Add all database messages
      validDbMessages.forEach((msg) => {
        messageMap.set(msg.id, msg);
        orderSeqMap.set(msg.orderSeq, msg);
      });

      // Second pass: Handle streaming messages with intelligent deduplication
      convertedStreamingMessages.forEach((streamMsg) => {
        const existingByOrderSeq = orderSeqMap.get(streamMsg.orderSeq);

        if (existingByOrderSeq) {
          messageMap.delete(existingByOrderSeq.id);
          messageMap.set(streamMsg.id, streamMsg);
          orderSeqMap.set(streamMsg.orderSeq, streamMsg);
        } else {
          messageMap.set(streamMsg.id, streamMsg);
          orderSeqMap.set(streamMsg.orderSeq, streamMsg);
        }
      });

      const result = Array.from(messageMap.values()).sort(
        (a, b) => a.orderSeq - b.orderSeq,
      );

      // Debug logging for message count changes
      const totalInputMessages =
        validDbMessages.length + convertedStreamingMessages.length;
      if (result.length !== totalInputMessages) {
        Logger.info("Message merge resulted in deduplication:", {
          dbMessages: validDbMessages.length,
          streamingMessages: convertedStreamingMessages.length,
          totalInput: totalInputMessages,
          finalResult: result.length,
          threadId: activeThreadId,
        });
      }

      return result;
    },
    [convertedStreamingMessages, activeThreadId],
  );

  const startStreamChat = useCallback(
    async (
      tabId: string,
      threadId: string,
      userMessageId: string,
      messages: Array<{
        role: "user" | "assistant" | "system" | "function";
        content: string;
        attachments?: string | null;
      }>,
      provider: Provider,
      modelId: string,
    ) => {
      try {
        const result = await providerService.startStreamChat({
          tabId,
          threadId,
          userMessageId,
          messages,
          provider,
          modelName: modelId,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        return result;
      } catch (error) {
        Logger.error("Failed to start stream chat:", error);
        throw error;
      }
    },
    [],
  );

  const reGenerateStreamChat = useCallback(
    async (
      regenerateMessageId: string,
      userMessageId: string,
      messages: Array<{
        role: "user" | "assistant" | "system" | "function";
        content: string;
        attachments?: string | null;
      }>,
      provider: Provider,
      modelId: string,
    ) => {
      if (!activeTab?.id || !activeThreadId) {
        throw new Error("No active tab or thread");
      }

      try {
        const result = await providerService.reGenerateStreamChat({
          tabId: activeTab.id,
          threadId: activeThreadId,
          userMessageId,
          messages,
          provider,
          modelName: modelId,
          regenerateMessageId,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        return result;
      } catch (error) {
        Logger.error("Failed to regenerate stream chat:", error);
        throw error;
      }
    },
    [activeTab?.id, activeThreadId],
  );

  const stopStreamChat = useCallback(async () => {
    if (!activeTabId) {
      return;
    }

    try {
      await providerService.stopStreamChat({
        tabId: activeTabId,
      });
    } catch (error) {
      Logger.error("Failed to stop stream chat:", error);
    }
  }, [activeTabId]);

  return {
    streamingMessages,
    convertedStreamingMessages,
    isStreaming,
    mergeMessages,
    startStreamChat,
    reGenerateStreamChat,
    stopStreamChat,
  };
}
