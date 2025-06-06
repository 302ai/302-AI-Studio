import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import {
  getMessagesByThreadId,
  insertMessage,
} from "@renderer/services/db-service/messages-db-service";
import {
  insertThread,
  updateThread,
} from "@renderer/services/db-service/threads-db-service";
import { useTabBarStore } from "@renderer/store/tab-bar-store";
import { triplitClient } from "@shared/triplit/client";
import type { CreateThreadData, Thread } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActiveThread } from "./use-active-thread";

export function useToolBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread",
  });
  const { activeThreadId, setActiveThreadId } = useActiveThread();
  const { tabs, activeTabId, addTab } = useTabBarStore();

  const threadsQuery = triplitClient
    .query("threads")
    .Order("createdAt", "DESC");
  const { results: threadItems } = useQuery(triplitClient, threadsQuery);
  const threads = threadItems ?? [];

  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const handleModelSelect = async (providerId: string, modelId: string) => {
    setSelectedProviderId(providerId);
    setSelectedModelId(modelId);

    if (activeThreadId) {
      try {
        await updateThread(activeThreadId, async (thread) => {
          thread.providerId = providerId;
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
      const { title, providerId, modelId } = threadData;
      const createData: CreateThreadData = {
        title,
        providerId,
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
      const isHomepage = tabs.length === 0;
      const currentThread = threads.find((thread) => thread.id === activeTabId);
      const hasActiveTab = tabs.some((tab) => tab.id === activeTabId);
      const needCreateThread = isHomepage || (hasActiveTab && !currentThread);

      let currentActiveThreadId: string | null = activeThreadId;

      if (needCreateThread) {
        const isNewTab = hasActiveTab && !currentThread;
        const title = isNewTab
          ? (tabs.find((tab) => tab.id === activeTabId)?.title ??
            t("new-thread-title"))
          : t("new-thread-title");

        const createThreadData: CreateThreadData = {
          title,
          providerId: selectedProviderId,
          modelId: selectedModelId,
        };

        const thread = await createThread(createThreadData);
        if (thread) {
          if (isHomepage) {
            // 只有在homepage时才创建新tab
            addTab({
              title,
              id: thread.id,
            });
          } else {
            // 新tab情况：更新现有tab的ID为thread ID
            const currentTab = tabs.find((tab) => tab.id === activeTabId);
            if (currentTab) {
              // 移除旧tab并添加新的带thread ID的tab
              useTabBarStore.getState().removeTab(activeTabId);
              addTab({
                title: currentTab.title,
                id: thread.id,
              });
            }
          }
          currentActiveThreadId = thread.id;
          console.log("Thread created successfully:", thread);
          console.log("activeThreadId", currentActiveThreadId);
        }
      }

      // 确保有活动线程
      if (!currentActiveThreadId) {
        throw new Error("No active thread available");
      }

      // 获取当前消息数量用于orderSeq
      const existingMessages = await getMessagesByThreadId(
        currentActiveThreadId,
      );
      const nextOrderSeq = existingMessages.length + 1;

      // 准备附件数据
      const attachmentsData =
        attachments && attachments.length > 0
          ? JSON.stringify(attachments)
          : null;

      // 插入用户消息
      await insertMessage({
        threadId: currentActiveThreadId,
        parentMessageId: null,
        role: "user",
        content,
        attachments: attachmentsData,
        orderSeq: nextOrderSeq,
        tokenCount: content.length,
        status: "success",
      });

      console.log("Message sent successfully");

      // 这里可以添加AI回复逻辑
      // 暂时插入一个mock的AI回复
      setTimeout(async () => {
        try {
          await insertMessage({
            threadId: currentActiveThreadId,
            parentMessageId: null,
            role: "assistant",
            content:
              "这是一个模拟的AI回复。在实际应用中，这里会调用真实的AI API来生成回复。",
            attachments: null,
            orderSeq: nextOrderSeq + 1,
            tokenCount: 50,
            status: "success",
          });
        } catch (error) {
          console.error("Failed to insert AI reply:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error; // 重新抛出错误供上层处理
    }
  };

  // Effect: Sync model selection with active thread
  useEffect(() => {
    if (activeThreadId) {
      // 当有活动线程时，同步模型选择
      const activeThread = threads.find(
        (thread) => thread.id === activeThreadId,
      );
      if (activeThread) {
        setSelectedProviderId(activeThread.providerId ?? "");
        setSelectedModelId(activeThread.modelId ?? "");
      }
    } else {
      // 当没有活动线程时，重置为待选状态
      setSelectedProviderId("");
      setSelectedModelId("");
    }
  }, [activeThreadId, threads]);

  return {
    selectedProviderId,
    selectedModelId,
    handleModelSelect,
    handleSendMessage,
    createThread,
  };
}
