import { triplitClient } from "@renderer/client";
import { useSidebar } from "@renderer/components/ui/sidebar";
import type { Thread } from "@shared/triplit/types";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTriplit } from "./use-triplit";

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
  threads: Thread[];
};

export function useSideBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "sidebar",
  });
  const { state } = useSidebar();
  const { threads, threadsFetching } = useTriplit({
    threads: triplitClient
      .query("threads")
      .Where("isPrivate", "=", false)
      .Order("updatedAt", "DESC"),
  });

  const [searchQuery, setSearchQuery] = useState("");

  const isSidebarCollapsed = state === "collapsed";

  const collectedThreads = useMemo(() => {
    if (!threads) return [];
    return threads.filter((thread) => thread.collected);
  }, [threads]);

  /**
   * Returns the grouped threads for the sidebar including collected threads and date-based groups
   * @returns The grouped threads
   */
  const groupedThreads = useMemo<GroupedThreads[]>(() => {
    if (!threads) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // * Create favorites category
    const collectedThreads = threads.filter((thread) => thread.collected);
    const favoritesCategory: GroupedThreads = {
      key: "collected",
      label: t("section.collected"),
      threads: collectedThreads,
    };

    const groupConfigs = [
      {
        key: "today",
        label: t("section.today"),
        filter: (thread: Thread) => {
          const date = new Date(thread.updatedAt);
          return date >= now;
        },
      },
      {
        key: "yesterday",
        label: t("section.yesterday"),
        filter: (thread: Thread) => {
          const date = new Date(thread.updatedAt);
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return date >= yesterday && date < now;
        },
      },
      {
        key: "last7Days",
        label: t("section.last7Days"),
        filter: (thread: Thread) => {
          const date = new Date(thread.updatedAt);
          const last7Days = new Date(now);
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          last7Days.setDate(now.getDate() - 7);
          return date >= last7Days && date < yesterday;
        },
      },
      {
        key: "last30Days",
        label: t("section.last30Days"),
        filter: (thread: Thread) => {
          const date = new Date(thread.updatedAt);
          const last30Days = new Date(now);
          const last7Days = new Date(now);
          last7Days.setDate(now.getDate() - 7);
          last30Days.setDate(now.getDate() - 30);
          return date >= last30Days && date < last7Days;
        },
      },
      {
        key: "earlier",
        label: t("section.earlier"),
        filter: (thread: Thread) => {
          const date = new Date(thread.updatedAt);
          const last30Days = new Date(now);
          last30Days.setDate(now.getDate() - 30);
          return date < last30Days;
        },
      },
    ];

    const dateBasedGroups = groupConfigs.reduce<GroupedThreads[]>(
      (acc, config) => {
        const filteredThreads = threads.filter(config.filter);

        return filteredThreads.length === 0
          ? acc
          : acc.concat({
              key: config.key as SidebarSection,
              label: config.label,
              threads: filteredThreads,
            });
      },
      [],
    );

    if (collectedThreads.length > 0) {
      return [favoritesCategory, ...dateBasedGroups];
    }

    return dateBasedGroups;
  }, [threads, t]);

  const filteredThreads = useMemo(() => {
    if (!threads) return [];

    return threads.filter((thread) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return thread.title.toLowerCase().includes(query);
    });
  }, [threads, searchQuery]);

  return {
    isSidebarCollapsed,
    groupedThreads,
    collectedThreads,
    filteredThreads,
    searchQuery,
    setSearchQuery,
    threadsFetching,
  };
}
