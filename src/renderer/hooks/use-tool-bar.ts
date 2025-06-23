import { triplitClient } from "@renderer/client";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import type {
  CreateThreadData,
  Model,
  Provider,
  Thread,
} from "@shared/triplit/types";
import { useQuery, useQueryOne } from "@triplit/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";

const {
  threadService,
  tabService,
  messageService,
  providerService,
  uiService,
} = window.service;

export function useToolBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread",
  });
  const { activeThreadId, setActiveThreadId } = useActiveThread();
  const { activeTab, activeTabId, setActiveTabId } = useActiveTab();

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

  const uiQuery = triplitClient.query("ui");
  const { result: ui } = useQueryOne(triplitClient, uiQuery);
  const selectedModelId = ui?.selectedModelId || "";

  const handleModelSelect = async (modelId: string) => {
    await uiService.updateSelectedModelId(modelId);

    if (activeThreadId) {
      try {
        await threadService.updateThread(activeThreadId, {
          modelId,
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

      const thread = await threadService.insertThread(createData);
      await setActiveThreadId(thread.id);

      return thread;
    } catch (error) {
      console.error("create thread error", error);
      toast.error(t("create-thread-error"));
      return null;
    }
  };

  const startStreamChat = async (
    tabId: string,
    threadId: string,
    userMessageId: string,
    messages: Array<{
      role: "user" | "assistant" | "system" | "function";
      content: string;
      id?: string; // Include message ID for attachment lookup
    }>,
    provider: Provider,
    model: Model,
  ) => {
    try {
      const result = await providerService.startStreamChat({
        tabId,
        threadId,
        userMessageId,
        messages,
        provider,
        model,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("Failed to start stream chat:", error);
      throw error;
    }
  };

  const handleSendMessage = async (
    content: string,
    attachments?: AttachmentFile[],
  ): Promise<void> => {
    try {
      let currentActiveThreadId: string | null = activeThreadId;
      let currentActiveTabId: string | null = activeTabId;

      const needCreateTab = tabs?.length === 0;
      const needCreateThread = needCreateTab || !activeTab?.threadId;
      if (needCreateThread) {
        const thread = await createThread({
          title: content,
          modelId: selectedModelId,
        });

        if (thread) {
          const { id, title } = thread;
          if (activeTab) {
            await tabService.updateTab(activeTab.id, {
              title,
              threadId: id,
            });
          } else {
            const newTab = await tabService.insertTab({
              title,
              threadId: id,
              type: "thread",
            });
            await setActiveTabId(newTab.id);
            currentActiveTabId = newTab.id;
          }

          currentActiveThreadId = thread.id;
          console.log("current active thread id: ", currentActiveThreadId);
        }
      }

      if (!currentActiveThreadId || !currentActiveTabId) {
        throw new Error("No active thread or tab available");
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
      const existingMessages = await messageService.getMessagesByThreadId(
        currentActiveThreadId,
      );
      const nextOrderSeq = existingMessages.length + 1;

      // Insert user message
      const userMessage = await messageService.insertMessage({
        threadId: currentActiveThreadId,
        parentMessageId: null,
        role: "user",
        content,
        orderSeq: nextOrderSeq,
        tokenCount: content.length,
        status: "success",
      });

      if (attachments && attachments.length > 0) {
        const attachmentData = attachments.map((attachment) => ({
          messageId: userMessage.id,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          preview: attachment.preview || null,
          fileData: attachment.fileData || null,
          fileContent: null,
        }));

        await window.service.attachmentService.insertAttachments(
          attachmentData,
        );
      }

      console.log("User message sent successfully:", userMessage);

      const conversationMessages = [
        ...existingMessages.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system" | "function",
          content: msg.content,
          id: msg.id,
        })),
        {
          role: "user" as const,
          content,
          id: userMessage.id,
        },
      ];

      // Start streaming chat
      try {
        await startStreamChat(
          currentActiveTabId,
          currentActiveThreadId,
          userMessage.id,
          conversationMessages,
          provider,
          selectedModel, // Use model name for the API call
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
    const syncSelectedModelId = async () => {
      if (activeThreadId) {
        const activeThread = threads.find(
          (thread) => thread.id === activeThreadId,
        );
        if (activeThread) {
          await uiService.updateSelectedModelId(activeThread.modelId);
        }
      }
    };

    syncSelectedModelId();
  }, [activeThreadId, threads]);

  const handleRefreshMessage = async (messageId: string) => {
    // Find the selected model and its provider
    const selectedModel = models?.find((model) => model.id === selectedModelId);
    if (!selectedModel) {
      toast.error(`${t("selected-model-not-found")}`);
      return;
    }

    const provider = providers?.find((p) => p.id === selectedModel.providerId);
    if (!provider) {
      toast.error(`${t("provider-not-found-for-selected-model")}`);
      return;
    }

    const existingMessages = await messageService.getMessagesByThreadId(
      activeThreadId ?? "",
    );
    const messageToRefresh = existingMessages.find((m) => m.id === messageId);
    if (!messageToRefresh) {
      toast.error(`${t("message-not-found")}`);
      return;
    }

    const messageIndex = existingMessages.findIndex(
      (m) => m.id === messageToRefresh.id,
    );
    const context = existingMessages.slice(0, messageIndex);

    // Delete all messages after the message to refresh (including the message itself)
    const messagesToDelete = existingMessages.slice(messageIndex);
    for (const msg of messagesToDelete) {
      try {
        await messageService.deleteMessage(msg.id, msg.threadId);
      } catch (error) {
        console.error("Failed to delete message:", msg.id, error);
      }
    }

    // 重新生成AI消息
    const conversationMessages = [
      ...context.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system" | "function",
        content: msg.content,
        id: msg.id, // Include message ID for attachment lookup
      })),
    ];

    // Find the last user message before the message to refresh
    const lastUserMessage = context
      .reverse()
      .find((msg) => msg.role === "user");
    const userMessageId = lastUserMessage?.id || "";

    // Use regular stream chat since we deleted the original message
    try {
      const data = await startStreamChat(
        activeTab?.id || "", // tabId
        activeThreadId || "", // threadId
        userMessageId, // userMessageId - the last user message that triggered this response
        conversationMessages,
        provider,
        selectedModel, // Use model name for the API call
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
