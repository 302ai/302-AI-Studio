import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import {
  insertThread,
  updateThread,
} from "@renderer/services/db-service/threads-db-service";
import { EventNames, emitter } from "@renderer/services/event-service";
import { useTabBarStore } from "@renderer/store/tab-bar-store";
import { triplitClient } from "@shared/triplit/client";
import type { CreateThreadData, Thread } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActiveThread } from "./use-active-thread";

export function useToolBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread",
  });
  const { activeThreadId, setActiveThreadId } = useActiveThread();
  const { tabs, activeTabId, addTab } = useTabBarStore();

  // Use triplit queries instead of model-setting-store
  const providersQuery = triplitClient
    .query("providers")
    .Where("enabled", "=", true);
  const { results: providers } = useQuery(triplitClient, providersQuery);

  const modelsQuery = triplitClient.query("models").Where("enabled", "=", true);
  const { results: models } = useQuery(triplitClient, modelsQuery);

  const threadsQuery = triplitClient
    .query("threads")
    .Order("createdAt", "DESC");
  const { results: threadItems } = useQuery(triplitClient, threadsQuery);
  const threads = threadItems ?? [];

  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  // Create enabled provider IDs set for validation
  const enabledProviderIds = useMemo(() => {
    const providersArray = providers ?? [];
    return new Set(providersArray.map((provider) => provider.id));
  }, [providers]);

  // Create provider model map from triplit data
  const providerModelMap = useMemo(() => {
    const modelsArray = models ?? [];
    const providerModelMap: Record<string, typeof modelsArray> = {};

    modelsArray.forEach((model) => {
      // Only include models from enabled providers
      if (enabledProviderIds.has(model.providerId)) {
        if (!providerModelMap[model.providerId]) {
          providerModelMap[model.providerId] = [];
        }
        providerModelMap[model.providerId].push(model);
      }
    });

    return providerModelMap;
  }, [models, enabledProviderIds]);

  // Function to sync model selection with thread
  const syncModelSelectionWithThread = useCallback((thread: Thread | null) => {
    if (!thread) {
      // Clear selection when no thread is active (placeholder state)
      setSelectedProviderId("");
      setSelectedModelId("");
      console.log("🔄 Cleared model selection (no active thread)");
      return;
    }

    const { providerId, modelId } = thread;

    // Check both provider and model availability
    const isProviderEnabled = enabledProviderIds.has(providerId);
    const isProviderAvailable = providerModelMap[providerId];
    const isModelAvailable = isProviderAvailable?.some(
      (model) => model.id === modelId && model.enabled,
    );

    if (isProviderEnabled && isProviderAvailable && isModelAvailable) {
      setSelectedProviderId(providerId);
      setSelectedModelId(modelId);
      console.log(`🔄 Synced model selection: ${providerId}/${modelId}`);
    } else {
      // If thread model not available, clear selection (placeholder state)
      console.warn(`⚠️ Thread model not available: ${providerId}/${modelId}`);
      console.warn(
        `Provider enabled: ${isProviderEnabled}, Provider available: ${!!isProviderAvailable}, Model available: ${!!isModelAvailable}`,
      );

      setSelectedProviderId("");
      setSelectedModelId("");
      console.log("🔄 Cleared model selection (invalid thread model)");
    }
  }, [enabledProviderIds, providerModelMap]);

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

  const handleSendMessage = async (attachments?: AttachmentFile[]) => {
    const isHomepage = tabs.length === 0;
    const currentThread = threads.find((thread) => thread.id === activeTabId);
    const hasActiveTab = tabs.some((tab) => tab.id === activeTabId);
    const needCreateThread = isHomepage || (hasActiveTab && !currentThread);

    let currentActiveThreadId: string | null = activeThreadId;

    if (needCreateThread) {
      const isNewTab = hasActiveTab && !currentThread;
      const title = isNewTab
        ? tabs.find((tab) => tab.id === activeTabId)?.title ?? t("new-thread-title")
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

    // * If thread already exists, continue conversation on existing thread
    const activeThread = threads.find(
      (thread) => thread.id === currentActiveThreadId,
    );
    console.log("activeThread", activeThread);

    // TODO: Send message logic (work with existing or newly created thread)
    if (attachments && attachments.length > 0) {
      console.log("Sending message with attachments:", attachments);
    }
  };

  // Effect: Sync model selection when activeThreadId changes
  useEffect(() => {
    const currentThread = threads.find((thread) => thread.id === activeThreadId);
    syncModelSelectionWithThread(currentThread || null);
  }, [activeThreadId, threads, syncModelSelectionWithThread]);

  // Effect: Handle tab selection events to sync model
  useEffect(() => {
    const handleTabSelect = (event: { tabId: string }) => {
      const thread = threads.find((thread) => thread.id === event.tabId);
      syncModelSelectionWithThread(thread || null);
    };

    const unsub = emitter.on(EventNames.TAB_SELECT, handleTabSelect);
    return () => unsub();
  }, [threads, syncModelSelectionWithThread]);

  // Effect: Handle thread selection events (legacy support)
  useEffect(() => {
    const handleThreadActive = (event: { thread: Thread }) => {
      syncModelSelectionWithThread(event.thread);
    };

    const unsub = emitter.on(EventNames.THREAD_SELECT, handleThreadActive);
    return () => unsub();
  }, [syncModelSelectionWithThread]);

  return {
    selectedProviderId,
    selectedModelId,
    handleModelSelect,
    handleSendMessage,
  };
}
