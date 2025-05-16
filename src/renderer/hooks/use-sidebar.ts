import { useMemo } from "react";
import { useThreadsStore } from "@renderer/store/threads-store";
import { ThreadItem } from "@renderer/types/threads";
import { useTranslation } from "react-i18next";
import { useBrowserTabStore } from "@renderer/store/browser-tab-store";

type SidebarSection =
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "earlier";

export type GroupedThreads = {
  key: SidebarSection;
  label: string;
  threads: ThreadItem[];
};

export function useSidebar() {
  const { t } = useTranslation();
  const { threads } = useThreadsStore();
  const { tabs, setActiveTabId, addTab } = useBrowserTabStore();

  /**
   * Returns the grouped threads for the sidebar based on the current date
   * @returns The grouped threads
   */
  const groupedThreads = useMemo<GroupedThreads[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const groupConfigs = [
      {
        key: "today",
        label: t("sidebar.section.today"),
        filter: (date: Date) => date >= now,
      },
      {
        key: "yesterday",
        label: t("sidebar.section.yesterday"),
        filter: (date: Date) => {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return date >= yesterday && date < now;
        },
      },
      {
        key: "last7Days",
        label: t("sidebar.section.last7Days"),
        filter: (date: Date) => {
          const last7Days = new Date(now);
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          last7Days.setDate(now.getDate() - 7);
          return date >= last7Days && date < yesterday;
        },
      },
      {
        key: "last30Days",
        label: t("sidebar.section.last30Days"),
        filter: (date: Date) => {
          const last30Days = new Date(now);
          const last7Days = new Date(now);
          last7Days.setDate(now.getDate() - 7);
          last30Days.setDate(now.getDate() - 30);
          return date >= last30Days && date < last7Days;
        },
      },
      {
        key: "earlier",
        label: t("sidebar.section.earlier"),
        filter: (date: Date) => {
          const last30Days = new Date(now);
          last30Days.setDate(now.getDate() - 30);
          return date < last30Days;
        },
      },
    ];

    const groups = groupConfigs.reduce<GroupedThreads[]>((acc, config) => {
      const filteredThreads = threads.filter((thread) => {
        if (!thread.createdAt) return false;
        return config.filter(new Date(thread.createdAt));
      });

      return filteredThreads.length === 0
        ? acc
        : acc.concat({
            key: config.key as SidebarSection,
            label: config.label,
            threads: filteredThreads,
          });
    }, []);

    return groups;
  }, [threads, t]);

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

  return { groupedThreads, handleClickThread };
}
