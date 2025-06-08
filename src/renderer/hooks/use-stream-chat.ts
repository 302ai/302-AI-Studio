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

export function useStreamChat() {
  const { activeTab } = useActiveTab();
  const { activeThreadId } = useActiveThread();
  const [streamingMessages, setStreamingMessages] = useState<
    StreamingMessage[]
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Set active tab for the global service
  useEffect(() => {
    streamChatEventService.setActiveTab(activeTab?.id || null);
  }, [activeTab?.id]);

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
        const result = await window.service.providerService.startStreamChat({
          tabId: activeTab.id,
          threadId: activeThreadId,
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
    [activeTab?.id, activeThreadId],
  );

  const stopStreamChat = useCallback(async () => {
    if (!activeTab?.id) {
      return;
    }

    try {
      await window.service.providerService.stopStreamChat({
        tabId: activeTab.id,
      });
    } catch (error) {
      Logger.error("Failed to stop stream chat:", error);
    }
  }, [activeTab?.id]);

  return {
    streamingMessages,
    isStreaming,
    startStreamChat,
    stopStreamChat,
  };
}
