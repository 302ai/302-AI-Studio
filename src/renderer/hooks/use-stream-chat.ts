/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import {
  type StreamingMessage,
  streamChatEventService,
} from "@renderer/services/stream-chat-event-service";
import type { Provider } from "@shared/triplit/types";
import Logger from "electron-log";
import { useCallback, useEffect, useState } from "react";
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
    isStreaming,
    startStreamChat,
    reGenerateStreamChat,
    stopStreamChat,
  };
}
