import { useMemo } from "react";
import { useThreadsStore } from "@renderer/store/threads-store";
import { ThreadItem } from "@renderer/types/threads";
import { useTranslation } from "react-i18next";

export type GroupedThreads = {
  section: string;
  threads: ThreadItem[];
};

export function useSidebar() {
  const { t } = useTranslation();
  const { threads } = useThreadsStore();

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

      if (filteredThreads.length === 0) return acc;
      return acc.concat({
        section: config.label,
        threads: filteredThreads,
      });
    }, []);

    return groups;
  }, [threads, t]);

  return { groupedThreads };
}
