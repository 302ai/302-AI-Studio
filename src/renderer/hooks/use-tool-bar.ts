import { triplitClient } from "@renderer/client";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import logger from "@shared/logger/renderer-logger";
import type {
  CreateThreadData,
  Model,
  Provider,
  Thread,
} from "@shared/triplit/types";
import { useQuery, useQueryOne } from "@triplit/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";
import { usePrivacyMode } from "./use-privacy-mode";

const {
  threadService,
  tabService,
  messageService,
  providerService,
  settingsService,
  attachmentService,
} = window.service;

export function useToolBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread",
  });
  const { t: oT } = useTranslation("translation");
  const { activeThreadId, setActiveThreadId } = useActiveThread();
  const { activeTab, activeTabId, setActiveTabId } = useActiveTab();
  const { privacyState } = usePrivacyMode();

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

  const settingsQuery = triplitClient.query("settings");
  const { result: settings } = useQueryOne(triplitClient, settingsQuery);

  const newChatModelId = settings?.newChatModelId || "";

  const isNewChat = !activeThreadId || !activeTab?.threadId;

  const [currentNewChatModelId, setCurrentNewChatModelId] =
    useState<string>("");
  const [currentTabId, setCurrentTabId] = useState<string | null>(null);

  useEffect(() => {
    if (isNewChat) {
      const tabId = activeTab?.id || null;
      if (tabId !== currentTabId) {
        const defaultModelId =
          newChatModelId === "use-last-model"
            ? settings?.selectedModelId || ""
            : newChatModelId;
        setCurrentNewChatModelId(defaultModelId);
        setCurrentTabId(tabId);
      }
    } else {
      // 清理新会话的临时状态
      setCurrentNewChatModelId("");
      setCurrentTabId(null);
    }
  }, [
    isNewChat,
    activeTab?.id,
    newChatModelId,
    settings?.selectedModelId,
    currentTabId,
  ]);

  // 根据是否为新会话来决定显示的模型ID
  const selectedModelId = isNewChat
    ? currentNewChatModelId || settings?.selectedModelId || ""
    : settings?.selectedModelId || "";

  const handleModelSelect = async (modelId: string) => {
    if (isNewChat) {
      // 对于新会话，只在当前会话期间临时记录用户的选择
      setCurrentNewChatModelId(modelId);
    } else {
      // 对于已存在的会话，更新全局selectedModelId和线程模型
      await settingsService.updateSelectedModelId(modelId);

      if (activeThreadId) {
        try {
          const providerId = models?.find((m) => m.id === modelId)?.providerId;
          await threadService.updateThread(activeThreadId, {
            modelId,
            providerId,
          });
        } catch (error) {
          logger.error("update thread error", { error });
        }
      }
    }
  };

  const createThread = async (
    threadData: CreateThreadData,
  ): Promise<Thread | null> => {
    try {
      const { title, modelId, providerId } = threadData;
      const createData: CreateThreadData = {
        title,
        modelId,
        providerId,
        isPrivate: privacyState.isPrivate,
      };

      const thread = await threadService.insertThread(createData);
      await setActiveThreadId(thread.id);
      return thread;
    } catch (error) {
      logger.error("create thread error", { error });
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
      logger.error("Failed to start stream chat", { error });
      throw error;
    }
  };

  const handleSendMessage = async (
    content: string,
    attachments?: AttachmentFile[],
    editMessageId?: string,
    tabId?: string,
    threadId?: string,
  ): Promise<void> => {
    let needSummaryTitle = false;
    try {
      let currentActiveThreadId: string | null = threadId || activeThreadId;
      let currentActiveTabId: string | null = tabId || activeTabId;

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

      const needCreateTab = tabs?.length === 0;
      const needCreateThread = needCreateTab || !activeTab?.threadId;
      if (needCreateThread) {
        needSummaryTitle = !privacyState.isPrivate;
        const thread = await createThread({
          title:
            (privacyState.isPrivate
              ? oT("thread.private-thread-title")
              : content) || " ",
          modelId: selectedModelId,
          providerId: provider.id,
          isPrivate: privacyState.isPrivate,
        });

        if (thread) {
          const { id, title } = thread;
          if (activeTab) {
            await tabService.updateTab(activeTab.id, {
              title: privacyState.isPrivate
                ? oT("thread.private-thread-title")
                : title,
              threadId: id,
            });
          } else {
            const newTab = await tabService.insertTab({
              title: privacyState.isPrivate
                ? oT("thread.private-thread-title")
                : title,
              threadId: id,
              type: "thread",
              isPrivate: privacyState.isPrivate,
            });
            await setActiveTabId(newTab.id);
            currentActiveTabId = newTab.id;
          }

          currentActiveThreadId = thread.id;
          logger.debug("current active thread id", { currentActiveThreadId });
        }
      }

      if (!currentActiveThreadId || !currentActiveTabId) {
        throw new Error("No active thread or tab available");
      }

      // Get existing messages for context
      const existingMessages = await messageService.getMessagesByThreadId(
        currentActiveThreadId,
      );

      // 处理编辑模型下的发送
      if (editMessageId !== "") {
        const messageToEdit = existingMessages.find(
          (m) => m.id === editMessageId,
        );
        if (!messageToEdit) {
          throw new Error("Message to edit not found");
        }
        const messageIndex = existingMessages.findIndex(
          (m) => m.id === editMessageId,
        );
        const context = existingMessages.slice(0, messageIndex);

        const messagesToDelete = existingMessages.slice(messageIndex);
        for (const msg of messagesToDelete) {
          await messageService.deleteMessage(msg.id, msg.threadId);
          if (!messageToEdit) {
            throw new Error("Message to edit not found");
          }
        }

        try {
          const userMessage = await messageService.insertMessage({
            threadId: currentActiveThreadId,
            parentMessageId: null,
            role: "user",
            content,
            orderSeq: messageToEdit.orderSeq,
            tokenCount: content.length,
            status: "success",
            modelId: selectedModelId,
            modelName: selectedModel.name,
            providerId: provider.id,
            isThinkBlockCollapsed: false,
          });

          if (attachments && attachments.length > 0) {
            const attachmentData = attachments.map((attachment) => ({
              messageId: userMessage.id,
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
              filePath: attachment.filePath,
              preview: attachment.preview || null,
              fileData: attachment.fileData || null,
              fileContent: null,
            }));

            await attachmentService.insertAttachments(attachmentData);
          }

          const updatedConversationMessages = [
            ...context.map((msg) => ({
              role: msg.role as "user" | "assistant" | "system" | "function",
              content: msg.content,
              id: msg.id, // Include message ID for attachment lookup
            })),
            {
              role: "user" as const,
              content,
              id: userMessage.id, // Include the new message ID for attachment lookup
            },
          ];

          await startStreamChat(
            currentActiveTabId,
            currentActiveThreadId,
            userMessage.id,
            updatedConversationMessages,
            provider,
            selectedModel,
          );
        } catch (streamError) {
          logger.error("Failed to start streaming chat", { streamError });
          toast.error(t("failed-to-generate-ai-response"));
          // Error handling is now done in the streaming hook
        }
        return;
      }

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
        modelId: selectedModelId,
        modelName: selectedModel.name,
        providerId: provider.id,
        isThinkBlockCollapsed: false,
      });

      if (attachments && attachments.length > 0) {
        const attachmentData = attachments.map((attachment) => ({
          messageId: userMessage.id,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          filePath: attachment.filePath,
          preview: attachment.preview || null,
          fileData: attachment.fileData || null,
          fileContent: null,
        }));

        await attachmentService.insertAttachments(attachmentData);
      }

      logger.info("User message sent successfully", { userMessage });

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

        if (needSummaryTitle) {
          const queryMessages = await messageService.getMessagesByThreadId(
            currentActiveThreadId,
          );
          const result = await providerService.summaryTitle({
            messages: queryMessages,
            provider,
            model: selectedModel,
          });
          if (result.success) {
            await threadService.updateThread(currentActiveThreadId, {
              title: result.text,
            });
            await tabService.updateTab(currentActiveTabId, {
              title: result.text,
            });
          }
        }
      } catch (streamError) {
        logger.error("Failed to start streaming chat", { streamError });
        toast.error(t("failed-to-generate-ai-response"));
        // Error handling is now done in the streaming hook
      }
    } catch (error) {
      logger.error("Failed to send message", { error });
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
          await settingsService.updateSelectedModelId(activeThread.modelId);
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
        logger.error("Failed to delete message", { msgId: msg.id, error });
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
      logger.debug("Regenerate data", { data });
    } catch (streamError) {
      logger.error("Failed to regenerate streaming chat", { streamError });
      toast.error(t("failed-to-generate-ai-response"));
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
