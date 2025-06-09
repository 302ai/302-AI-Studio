import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import {
  getMessagesByThreadId,
  insertMessage,
} from "@renderer/services/db-services/messages-db-service";
import {
  insertThread,
  updateThread,
} from "@renderer/services/db-services/threads-db-service";
import { EventNames, emitter } from "@renderer/services/event-service";
import { triplitClient } from "@shared/triplit/client";
import type { CreateThreadData, Thread } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";
import { useStreamChat } from "./use-stream-chat";

export function useToolBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread",
  });
  const { activeThreadId, setActiveThreadId } = useActiveThread();
  const { activeTab } = useActiveTab();
  const { startStreamChat, reGenerateStreamChat } = useStreamChat();

  const tabsQuery = triplitClient.query("tabs").Order("order", "ASC");
  const { results: tabs } = useQuery(triplitClient, tabsQuery);

  const threadsQuery = triplitClient
    .query("threads")
    .Order("createdAt", "DESC");
  const { results: threadItems } = useQuery(triplitClient, threadsQuery);
  const threads = threadItems ?? [];

  // Query providers and models
  const providersQuery = triplitClient.query("providers");
  const { results: providers } = useQuery(triplitClient, providersQuery);

  const modelsQuery = triplitClient.query("models");
  const { results: models } = useQuery(triplitClient, modelsQuery);

  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const handleModelSelect = async (modelId: string) => {
    setSelectedModelId(modelId);
    console.log("selectedModelId", modelId);

    if (activeThreadId) {
      try {
        await updateThread(activeThreadId, async (thread) => {
          thread.modelId = modelId;
        });
      } catch (error) {
        console.error("update thread error", error);
      }
    }
  };

  const createThread = async (
    threadData: CreateThreadData,
  ): Promise<Thread | null> => {
    try {
      const { title, modelId } = threadData;
      const createData: CreateThreadData = {
        title,
        modelId,
      };

      const thread = await insertThread(createData);
      await setActiveThreadId(thread.id);

      return thread;
    } catch (error) {
      console.error("create thread error", error);
      toast.error(t("create-thread-error"));
      return null;
    }
  };

  const handleSendMessage = async (
    content: string,
    attachments?: AttachmentFile[],
  ): Promise<void> => {
    try {
      let currentActiveThreadId: string | null = activeThreadId;

      const needCreateTab = tabs?.length === 0;
      const needCreateThread = needCreateTab || !activeTab?.threadId;
      if (needCreateThread) {
        const thread = await createThread({
          title: t("new-thread-title"),
          modelId: selectedModelId,
        });

        if (thread) {
          emitter.emit(EventNames.THREAD_ADD, { thread: thread });
          currentActiveThreadId = thread.id;
          console.log("current active thread id: ", currentActiveThreadId);
        }
      }

      if (!currentActiveThreadId) {
        throw new Error("No active thread available");
      }

      if (!selectedModelId) {
        throw new Error("No model selected");
      }

      // Find the selected model and its provider
      const selectedModel = models?.find(
        (model) => model.id === selectedModelId,
      );
      if (!selectedModel) {
        throw new Error("Selected model not found");
      }

      const provider = providers?.find(
        (p) => p.id === selectedModel.providerId,
      );
      if (!provider) {
        throw new Error("Provider not found for selected model");
      }

      // Get existing messages for context
      const existingMessages = await getMessagesByThreadId(
        currentActiveThreadId,
      );
      const nextOrderSeq = existingMessages.length + 1;

      // Prepare attachments data
      const attachmentsData =
        attachments && attachments.length > 0
          ? JSON.stringify(attachments)
          : null;

      // Insert user message
      const userMessage = await insertMessage({
        threadId: currentActiveThreadId,
        parentMessageId: null,
        role: "user",
        content,
        attachments: attachmentsData,
        orderSeq: nextOrderSeq,
        tokenCount: content.length,
        status: "success",
      });

      console.log("User message sent successfully:", userMessage);

      // Prepare conversation context for AI
      const conversationMessages = [
        ...existingMessages.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system" | "function",
          content: msg.content,
          attachments: msg.attachments,
        })),
        {
          role: "user" as const,
          content,
          attachments: attachmentsData,
        },
      ];

      // Start streaming chat
      try {
        await startStreamChat(
          userMessage.id,
          conversationMessages,
          provider,
          selectedModel.name, // Use model name for the API call
        );
      } catch (streamError) {
        console.error("Failed to start streaming chat:", streamError);
        toast.error("Failed to start AI response");
        // Error handling is now done in the streaming hook
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  };

  // Effect: Sync model selection with active thread
  useEffect(() => {
    if (activeThreadId) {
      const activeThread = threads.find(
        (thread) => thread.id === activeThreadId,
      );
      if (activeThread) {
        setSelectedModelId(activeThread.modelId ?? "");
      }
    } else {
      setSelectedModelId("");
    }
  }, [activeThreadId, threads]);


  const handleRefreshMessage = async (messageId: string) => {
       // Find the selected model and its provider
       const selectedModel = models?.find(
        (model) => model.id === selectedModelId,
      );
      if (!selectedModel) {
        throw new Error("Selected model not found");
      }

      const provider = providers?.find(
        (p) => p.id === selectedModel.providerId,
      );
      if (!provider) {
        throw new Error("Provider not found for selected model");
      }

    const existingMessages = await getMessagesByThreadId(activeThreadId ?? "");
    const messageToRefresh = existingMessages.find(
      (m) => m.id === messageId,
    );
    if (!messageToRefresh) {
      throw new Error("Message not found");
    }
    const context = existingMessages.slice(
      0,
      existingMessages.findIndex((m) => m.id === messageToRefresh.id),
    );
    // 重新生成AI消息
    const conversationMessages = [
      ...context.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system" | "function",
        content: msg.content,
        attachments: msg.attachments,
      })),
    ];

    // Find the last user message before the message to refresh
    const lastUserMessage = context.reverse().find(msg => msg.role === "user");
    const userMessageId = lastUserMessage?.id || "";


    // Use regenerate stream chat instead of regular stream chat
    try {
      const data = await reGenerateStreamChat(
        messageId, // regenerateMessageId
        userMessageId, // userMessageId - the last user message that triggered this response
        conversationMessages,
        provider,
        selectedModel.name, // Use model name for the API call
      );
      console.log("Regenerate data", data);

    } catch (streamError) {
      console.error("Failed to regenerate streaming chat:", streamError);
      toast.error("Failed to regenerate AI response");
      // Error handling is now done in the streaming hook
    }
   
  };

  return {
    selectedModelId,
    handleModelSelect,
    handleSendMessage,
    createThread,
    handleRefreshMessage,
  };
}
