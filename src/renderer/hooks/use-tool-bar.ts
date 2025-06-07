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

export function useToolBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread",
  });
  const { activeThreadId, setActiveThreadId } = useActiveThread();
  const { activeTab } = useActiveTab();

  const tabsQuery = triplitClient.query("tabs").Order("order", "ASC");
  const { results: tabs } = useQuery(triplitClient, tabsQuery);

  const threadsQuery = triplitClient
    .query("threads")
    .Order("createdAt", "DESC");
  const { results: threadItems } = useQuery(triplitClient, threadsQuery);
  const threads = threadItems ?? [];

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
          emitter.emit(EventNames.THREAD_SELECT, { thread: thread });

          currentActiveThreadId = thread.id;
          console.log("current active thread id: ", currentActiveThreadId);
        }
      }

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

  return {
    selectedModelId,
    handleModelSelect,
    handleSendMessage,
    createThread,
  };
}
