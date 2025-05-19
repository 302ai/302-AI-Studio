import { useThreadsStore } from "@renderer/store/threads-store";
import { useTabBarStore } from "@/src/renderer/store/tab-bar-store";
import { useTranslation } from "react-i18next";

export function useToolBar() {
  const { t } = useTranslation();

  const { activeThreadId, addThread } = useThreadsStore();
  const { tabs, getActiveTab, addTab } = useTabBarStore();

  const handleSendMessage = () => {
    if (tabs.length === 0) {
      addTab({
        title: t("thread.new-thread-title"),
      });
    }

    // Get the newest active tab after adding a new tab immediately
    const activeTab = getActiveTab();
    const activeTabId = activeTab?.id ?? "";
    if (activeThreadId !== activeTabId) {
      addThread({
        id: activeTabId,
        title: activeTab?.title ?? t("thread.new-thread-title"),
      });
    }
  };

  return { handleSendMessage };
}
