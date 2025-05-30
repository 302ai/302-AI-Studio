import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";
import { useTabBarStore } from "@renderer/store/tab-bar-store";
import { useThreadsStore } from "@renderer/store/threads-store";
import type { Model } from "@shared/types/model";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface GroupedModel {
  id: string;
  name: string;
  models: Model[];
}

export function useToolBar() {
  const { t } = useTranslation();
  const { threads, addThread } = useThreadsStore();
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

  const handleSendMessage = () => {
    const settings = {
      providerId: selectedProviderId,
      modelId: selectedModelId,
    };

    if (tabs.length === 0) {
      // * Handle homepage condition
      const title = t("thread.new-thread-title");
      const newTabId = addTab({
        title,
      });
      addThread({
        id: newTabId,
        title,
        settings,
      });
    } else {
      // * Handle tab exists condition
      if (!threads.some((thread) => thread.id === activeTabId)) {
        // * Handle new tab condition (thread not exists)
        const activeTab = tabs.find((tab) => tab.id === activeTabId);
        addThread({
          id: activeTabId,
          title: activeTab?.title ?? t("thread.new-thread-title"),
          settings,
        });
      }

      // TODO: Send message logic
    }
  };

  return {
    selectedProviderId,
    selectedModelId,
    groupedModels,
    providerMap,
    handleModelSelect,
    handleSendMessage,
  };
}
