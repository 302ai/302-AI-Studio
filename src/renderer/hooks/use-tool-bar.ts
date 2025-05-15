import { useThreadsStore } from "@renderer/store/threads-store";
import { useBrowserTabStore } from "@renderer/store/browser-tab-store";
import { useTranslation } from "react-i18next";

export function useToolBar() {
  const { t } = useTranslation();

  const { activeThreadId, setActiveThreadId, addThread } = useThreadsStore();
  const { tabs, getActiveTab, addTab } = useBrowserTabStore();

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
      setActiveThreadId(activeTabId);
      addThread({
        id: activeTabId,
        title: activeTab?.title ?? t("thread.new-thread-title"),
      });
    }
  };

  return { handleSendMessage };
}
