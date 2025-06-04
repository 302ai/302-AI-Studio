import { EventNames, emitter } from "@renderer/services/event-service";
import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";
import { useTabBarStore } from "@renderer/store/tab-bar-store";
import { useThreadsStore } from "@renderer/store/threads-store";
import { triplitClient } from "@shared/triplit/client";
import { updateThread } from "@shared/triplit/helpers";
import type { CreateThreadData, Thread } from "@shared/triplit/types";
import type { ThreadItem } from "@shared/types/thread";
import { useQuery } from "@triplit/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useToolBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread",
  });
  const { activeThreadId: _activeThreadId, setActiveThreadId } =
    useThreadsStore();
  const { tabs, activeTabId, addTab } = useTabBarStore();
  const { providerModelMap } = useModelSettingStore();

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

    if (_activeThreadId) {
      try {
        await updateThread(_activeThreadId, async (thread) => {
          thread.providerId = providerId;
        });
      } catch (error) {
        console.error("update thread error", error);
      }
    }
  };

  const createThread = async (
    threadData: CreateThreadData
  ): Promise<Thread | null> => {
    try {
      const { title, providerId, modelId } = threadData;
      const createData: CreateThreadData = {
        title,
        providerId,
        modelId,
      };

      const thread = await triplitClient.insert("threads", createData);
      setActiveThreadId(thread.id);

      return thread;
    } catch (error) {
      console.error("create thread error", error);
      toast.error(t("create-thread-error"));
      return null;
    }
  };

  const handleSendMessage = async () => {
    const isHomepage = tabs.length === 0;
    const threadNotExists = !threads.some(
      (thread) => thread.id === activeTabId
    );

    let activeThreadId: string | null = _activeThreadId;

    if (isHomepage) {
      // * Handle homepage condition
      const title = t("new-thread-title");

      const createThreadData: CreateThreadData = {
        title,
        providerId: selectedProviderId,
        modelId: selectedModelId,
      };

      const thread = await createThread(createThreadData);
      if (thread) {
        addTab({
          title,
          id: thread.id,
        });
        activeThreadId = thread.id;
        console.log("Thread created successfully:", thread);
        console.log("activeThreadId", activeThreadId);
      }
    } else if (threadNotExists) {
      // * Handle new tab condition - tab exists but thread doesn't
      const activeTab = tabs.find((tab) => tab.id === activeTabId);

      const createThreadData: CreateThreadData = {
        title: activeTab?.title ?? t("new-thread-title"),
        providerId: selectedProviderId,
        modelId: selectedModelId,
      };

      const thread = await createThread(createThreadData);
      if (thread) {
        addTab({
          title: activeTab?.title ?? t("new-thread-title"),
          id: thread.id,
        });
        activeThreadId = thread.id;
        console.log("Thread created successfully:", thread);
        console.log("activeThreadId", activeThreadId);
      }
    }

    // * If thread already exists, continue conversation on existing thread
    // * No need to create new thread
    const activeThread = threads.find((thread) => thread.id === activeThreadId);
    console.log("activeThread", activeThread);

    // TODO: Send message logic (work with existing or newly created thread)
  };

  useEffect(() => {
    const handleThreadActive = (event: { thread: ThreadItem }) => {
      const { providerId, modelId } = event.thread;
      const isProviderAvailable = providerModelMap[providerId];
      const isModelAvailable = isProviderAvailable?.some(
        (model) => model.id === modelId && model.enabled
      );

      if (isProviderAvailable && isModelAvailable) {
        setSelectedProviderId(providerId);
        setSelectedModelId(modelId);

        console.log(`🔄 Synced model selection: ${providerId}/${modelId}`);
      } else {
        // TODO: If thread model not available, set default model
        console.warn(`⚠️ Thread model not available: ${providerId}/${modelId}`);
      }
    };

    const unsub = emitter.on(EventNames.THREAD_SELECT, handleThreadActive);
    return () => unsub();
  }, [providerModelMap]);

  return {
    selectedProviderId,
    selectedModelId,
    handleModelSelect,
    handleSendMessage,
  };
}
