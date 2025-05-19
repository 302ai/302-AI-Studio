import { useThreadsStore } from "@renderer/store/threads-store";
import { useBrowserTabStore } from "@renderer/store/browser-tab-store";

export function useSidebar() {
  const { threads } = useThreadsStore();
  const { tabs, setActiveTabId, addTab } = useBrowserTabStore();

  /**
   * Handles the click event for a thread in the sidebar
   * * If the thread is already open, it will be set as the active tab
   * * Else if the thread is not open, it will be added to the tabs and set as the active tab
   * @param threadId The id of the thread to be clicked
   */
  const handleClickThread = (threadId: string) => {
    if (tabs.find((tab) => tab.id === threadId)) {
      setActiveTabId(threadId);
    } else {
      const currentThread = threads.find((thread) => thread.id === threadId);
      if (currentThread) {
        addTab({
          title: currentThread.title,
          id: currentThread.id,
        });
      }
    }
  };

  return { handleClickThread };
}
