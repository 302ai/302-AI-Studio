import { triplitClient } from "@renderer/client";
import type { Thread } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useEffect, useMemo } from "react";
import { EventNames, emitter } from "../services/event-service";
import { useActiveThread } from "./use-active-thread";
import { usePrivacyMode } from "./use-privacy-mode";

const { threadService, uiService, tabService } = window.service;

export function useThread() {
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
    handleClickThread,
  };
}
