import { triplitClient } from "@renderer/client";
import type { Thread } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { EventNames, emitter } from "../services/event-service";
import { useActiveThread } from "./use-active-thread";
import { usePrivacyMode } from "./use-privacy-mode";

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

const { threadService, uiService, tabService } = window.service;

export function useThread() {
  const { t } = useTranslation();
  const { activeThreadId, setActiveThreadId } = useActiveThread();
  const { confirmSwitchFromPrivate } = usePrivacyMode();

  const threadsQuery = triplitClient
    .query("threads")
    .Where("isPrivate", "=", false)
    .Order("createdAt", "DESC");
  const { results: threadItems } = useQuery(triplitClient, threadsQuery);
  const threads = threadItems ?? [];

  const threadMap = useMemo(() => {
    return threads.reduce(
      (acc, thread) => {
        acc[thread.id] = thread;
        return acc;
      },
      {} as Record<string, Thread>,
    );
  }, [threads]);

  const collectedThreads = threads.filter((thread) => thread.collected);

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
        filter: (thread: Thread) => thread.collected,
      },
      {
        key: "today",
        label: t("sidebar.section.today"),
        filter: (thread: Thread) => {
          if (thread.collected) return false;
          const date = new Date(thread.createdAt);
          return date >= now;
        },
      },
      {
        key: "yesterday",
        label: t("sidebar.section.yesterday"),
        filter: (thread: Thread) => {
          if (thread.collected) return false;
          const date = new Date(thread.createdAt);
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return date >= yesterday && date < now;
        },
      },
      {
        key: "last7Days",
        label: t("sidebar.section.last7Days"),
        filter: (thread: Thread) => {
          if (thread.collected) return false;
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
        filter: (thread: Thread) => {
          if (thread.collected) return false;
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
        filter: (thread: Thread) => {
          if (thread.collected) return false;
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

  /**
   * Handles the click event for a thread in the sidebar
   * * If the thread is already open, it will be set as the active tab
   * * Else if the thread is not open, it will be added to the tabs and set as the active tab
   * @param threadId The id of the thread to be clicked
   */
  const handleClickThread = async (threadId: string) => {
    const canSwitch = await confirmSwitchFromPrivate(
      "switch to another thread",
    );
    if (!canSwitch) {
      return;
    }

    await setActiveThreadId(threadId);
    emitter.emit(EventNames.THREAD_SELECT, { thread: threadMap[threadId] });
  };

  useEffect(() => {
    /**
     * * Handles the tab select event
     */
    const handleTabSelect = async (event: { tabId: string }) => {
      const tab = await tabService.getTab(event.tabId);
      await setActiveThreadId(tab?.threadId ?? "");
    };
    /**
     * * Handles the tab close event
     */
    const handleTabClose = async (event: {
      tabId: string;
      nextActiveTabId: string;
    }) => {
      const nextActiveTab = await tabService.getTab(event.nextActiveTabId);
      const thread = await threadService.getThreadById(
        nextActiveTab?.threadId ?? "",
      );

      await setActiveThreadId(thread ? thread.id : "");
    };
    /**
     * * Handles the tab close all event
     */
    const handleTabCloseAll = async () => {
      await uiService.clearActiveThreadId();
    };

    const unsubs = [
      emitter.on(EventNames.TAB_SELECT, handleTabSelect),
      emitter.on(EventNames.TAB_CLOSE, handleTabClose),
      emitter.on(EventNames.TAB_CLOSE_ALL, handleTabCloseAll),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [setActiveThreadId]);

  return {
    activeThreadId,
    groupedThreads,
    collectedThreads,
    handleClickThread,
  };
}
