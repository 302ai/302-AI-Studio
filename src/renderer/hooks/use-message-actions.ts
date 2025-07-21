import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import type { CreateMessageData, Message } from "@shared/triplit/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActiveTab } from "./use-active-tab";
import { usePrivacyMode } from "./use-privacy-mode";
import { useToolBar } from "./use-tool-bar";

const { tabService, messageService } = window.service;

export function useMessageActions() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { t } = useTranslation("translation", { keyPrefix: "message" });
  const { createThread, selectedModelId } = useToolBar();
  const { setActiveTabId } = useActiveTab();
  const { privacyState } = usePrivacyMode();

  const handleRefreshMessage = async (
    messageId: string,
    onRefresh: (messageId: string) => Promise<void>,
  ) => {
    await onRefresh(messageId);
  };

  const handleEditAssistantMessage = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditUserMessage = (message: Message) => {
    emitter.emit(EventNames.MESSAGE_EDIT, message);
  };

  const handleCreateNewBranch = async (
    message: Message,
    providerId: string,
  ): Promise<{ threadId: string; tabId: string } | null> => {
    try {
      const thread = await createThread({
        title: t("context-menu.new-thread-title"),
        modelId: selectedModelId,
        providerId,
        isPrivate: privacyState?.isPrivate || false,
      });

      if (!thread) {
        logger.error("Failed to create thread");
        return null;
      }

      const { id: threadId, title } = thread;
      const newTab = await tabService.insertTab({
        title,
        threadId,
        type: "thread",
        isPrivate: privacyState?.isPrivate || false,
      });

      if (!newTab) {
        logger.error("Failed to create new tab");
        return null;
      }

      const messages = await messageService.getMessagesByThreadId(
        message.threadId,
      );
      const currentMessageIndex = messages.findIndex(
        (msg) => msg.id === message.id,
      );

      if (currentMessageIndex === -1) {
        logger.warn("Current message not found in thread");
        await setActiveTabId(newTab.id);
        return null;
      }

      const messagesToInsert = messages.slice(0, currentMessageIndex + 1);
      const messagesToInsertData: CreateMessageData[] = messagesToInsert.map(
        (msg) => {
          const { id: _id, ...msgWithoutIdAndDate } = msg;
          return { ...msgWithoutIdAndDate, threadId };
        },
      );

      await messageService.insertMessages(messagesToInsertData);
      await setActiveTabId(newTab.id);
      return { threadId, tabId: newTab.id };
    } catch (error) {
      logger.error("Error creating new branch:", { error });
      toast.error(t("context-menu.create-new-branch-error"));
      return null;
    }
  };

  const handleDeleteMessage = async (messageId: string, threadId: string) => {
    try {
      await messageService.deleteMessage(messageId, threadId);
      toast.success(t("delete-success"));
    } catch (error) {
      logger.error("Error deleting message:", { error });
      toast.error(t("delete-error"));
    }
  };

  return {
    isEditDialogOpen,
    setIsEditDialogOpen,
    handleRefreshMessage,
    handleEditAssistantMessage,
    handleEditUserMessage,
    handleCreateNewBranch,
    handleDeleteMessage,
  };
}
