import { EventNames, emitter } from "@renderer/services/event-service";
import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";
import { useTabBarStore } from "@renderer/store/tab-bar-store";
import { useThreadsStore } from "@renderer/store/threads-store";
import type { Model } from "@shared/types/model";
import type { ThreadItem } from "@shared/types/thread";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const { threadsService } = window.service;

interface GroupedModel {
  id: string;
  name: string;
  models: Model[];
}

export function useToolBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread",
  });
  const {
    threads,
    addThread,
    activeThreadId: _activeThreadId,
  } = useThreadsStore();
  const { tabs, activeTabId, addTab } = useTabBarStore();
  const { providerModelMap, providerMap } = useModelSettingStore();

  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const groupedModels = useMemo(() => {
    const result: GroupedModel[] = [];

    Object.entries(providerModelMap).forEach(([providerId, models]) => {
      const enabledModels = models.filter((model) => model.enabled);

      if (enabledModels.length > 0) {
        result.push({
          id: providerId,
          name: providerMap[providerId]?.name || providerId,
          models: enabledModels,
        });
      }
    });

    return result;
  }, [providerModelMap, providerMap]);

  const handleModelSelect = (providerId: string, modelId: string) => {
    setSelectedProviderId(providerId);
    setSelectedModelId(modelId);
  };

  const createThread = async (
    threadData: ThreadItem
  ): Promise<string | null> => {
    const { success, threadId, error } = await threadsService.createThread(
      threadData
    );
    if (success && threadId) {
      return threadId;
    }

    console.error("create thread error", error);

    toast.error(t("create-thread-error"));
    return null;
  };

  const handleSendMessage = async () => {
    const settings = {
      providerId: selectedProviderId,
      modelId: selectedModelId,
    };

    const isHomepage = tabs.length === 0;
    const threadNotExists = !threads.some(
      (thread) => thread.id === activeTabId
    );

    let activeThreadId: string | null = _activeThreadId;

    if (isHomepage) {
      // * Handle homepage condition
      const title = t("new-thread-title");
      const newTabId = addTab({
        title,
      });
      const newThread = addThread({
        id: newTabId,
        title,
        settings,
      });

      activeThreadId = await createThread(newThread);
    } else if (threadNotExists) {
      // * Handle new tab condition - tab exists but thread doesn't
      const activeTab = tabs.find((tab) => tab.id === activeTabId);
      const newThread = addThread({
        id: activeTabId,
        title: activeTab?.title ?? t("new-thread-title"),
        settings,
      });

      activeThreadId = await createThread(newThread);
    }
    // * If thread already exists, continue conversation on existing thread
    // * No need to create new thread
    const activeThread = threads.find((thread) => thread.id === activeThreadId);
    console.log("activeThread", activeThread);

    // TODO: Send message logic (work with existing or newly created thread)
  };

  useEffect(() => {
    const handleThreadActive = (event: { thread: ThreadItem }) => {
      const { providerId, modelId } = event.thread.settings;
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
    groupedModels,
    providerMap,
    handleModelSelect,
    handleSendMessage,
  };
}
