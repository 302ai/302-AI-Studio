import { useThreadsStore } from "@renderer/store/threads-store";
import { useTabBarStore } from "@renderer/store/tab-bar-store";
import { useTranslation } from "react-i18next";

export function useToolBar() {
  const { t } = useTranslation();
  const { threads, addThread } = useThreadsStore();
  const { tabs, activeTabId, addTab } = useTabBarStore();

  const handleSendMessage = () => {
    if (tabs.length === 0) {
      // * Handle homepage condition
      const title = t("thread.new-thread-title");
      const newTabId = addTab({
        title,
      });
      addThread({
        id: newTabId,
        title,
      });
    } else {
      // * Handle tab exists condition
      if (!threads.some((thread) => thread.id === activeTabId)) {
        // * Handle new tab condition (thread not exists)
        const activeTab = tabs.find((tab) => tab.id === activeTabId);
        addThread({
          id: activeTabId,
          title: activeTab?.title ?? t("thread.new-thread-title"),
        });
      }

      // TODO: Send message logic
    }
  };

  return { handleSendMessage };
}
