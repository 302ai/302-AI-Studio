import { useMemo } from "react";
import { ThreadItem } from "../types/threads";
import { useThreadsStore } from "../store/threads-store";
import { useTranslation } from "react-i18next";

type SidebarSection =
  | "collected"
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

export function useThread() {
  const { t } = useTranslation();
  const { threads } = useThreadsStore();

  const collectedThreads = threads.filter((thread) => thread.isCollected);

  /**
   * Returns the grouped threads for the sidebar including collected threads and date-based groups
   * @returns The grouped threads
   */
  const groupedThreads = useMemo<GroupedThreads[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const groupConfigs = [
      {
        key: "collected",
        label: t("sidebar.section.collected"),
        filter: (thread: ThreadItem) => thread.isCollected,
      },
      {
        key: "today",
        label: t("sidebar.section.today"),
        filter: (thread: ThreadItem) => {
          if (thread.isCollected) return false;
          const date = new Date(thread.createdAt);
          return date >= now;
        },
      },
      {
        key: "yesterday",
        label: t("sidebar.section.yesterday"),
        filter: (thread: ThreadItem) => {
          if (thread.isCollected) return false;
          const date = new Date(thread.createdAt);
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return date >= yesterday && date < now;
        },
      },
      {
        key: "last7Days",
        label: t("sidebar.section.last7Days"),
        filter: (thread: ThreadItem) => {
          if (thread.isCollected) return false;
          const date = new Date(thread.createdAt);
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
        filter: (thread: ThreadItem) => {
          if (thread.isCollected) return false;
          const date = new Date(thread.createdAt);
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
        filter: (thread: ThreadItem) => {
          if (thread.isCollected) return false;
          const date = new Date(thread.createdAt);
          const last30Days = new Date(now);
          last30Days.setDate(now.getDate() - 30);
          return date < last30Days;
        },
      },
    ];

    /**
     * * Group threads according to the filters defined in groupConfigs
     * * Each thread is only included in one group based on its filter criteria
     */
    const groups = groupConfigs.reduce<GroupedThreads[]>((acc, config) => {
      const filteredThreads = threads.filter(config.filter);

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

  return {
    groupedThreads,
    collectedThreads,
  };
}
