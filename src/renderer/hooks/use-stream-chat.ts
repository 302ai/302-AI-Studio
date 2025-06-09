/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import {
  type StreamingMessage,
  streamChatEventService,
} from "@renderer/services/stream-chat-event-service";
import type { Provider } from "@shared/triplit/types";
import Logger from "electron-log";
import { useCallback, useEffect, useState } from "react";
import { useActiveTab } from "./use-active-tab";

export function useStreamChat() {
  const { activeTabId } = useActiveTab();
  const [streamingMessages, setStreamingMessages] = useState<
    StreamingMessage[]
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Set active tab for the global service
  useEffect(() => {
    streamChatEventService.setActiveTab(activeTabId || null);
  }, [activeTabId]);

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
        const result = await window.service.providerService.startStreamChat({
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

  const stopStreamChat = useCallback(async () => {
    if (!activeTabId) {
      return;
    }

    try {
      await window.service.providerService.stopStreamChat({
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
    stopStreamChat,
  };
}
