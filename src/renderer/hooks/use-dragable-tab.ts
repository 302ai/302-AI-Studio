import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import { useCallback, useEffect, useRef } from "react";
import { useActiveTab } from "./use-active-tab";
import { usePrivacyMode } from "./use-privacy-mode";

interface HookParams {
  id: string;
  index: number;
}

const { tabService } = window.service;

export function useDragableTab({ id }: HookParams) {
  const { setActiveTabId, tabs } = useActiveTab();
  const { confirmSwitchFromPrivate } = usePrivacyMode();

  const ref = useRef<HTMLDivElement>(null);

  const handleTabReload = useCallback(async () => {
    emitter.emit(EventNames.TAB_RELOAD, { tabId: id });
  }, [id]);

  const handleTabClose = useCallback(async () => {
    try {
      const canClose = await confirmSwitchFromPrivate("close this tab");
      if (!canClose) {
        return;
      }

      const nextActiveTabId = await tabService.deleteTab(id);
      emitter.emit(EventNames.TAB_CLOSE, { tabId: id, nextActiveTabId });
    } catch (error) {
      logger.error("Error closing tab", { error });
    }
  }, [id, confirmSwitchFromPrivate]);

  const handleTabCloseAll = useCallback(async () => {
    try {
      await tabService.deleteAllTabs();
      emitter.emit(EventNames.TAB_CLOSE_ALL, null);
    } catch (error) {
      logger.error("Error closing all tabs", { error });
    }
  }, []);

  useEffect(() => {
    const handleThreadRename = async (event: {
      threadId: string;
      newTitle: string;
    }) => {
      const tabToUpdate = tabs.find((tab) => tab.threadId === event.threadId);
      if (tabToUpdate) {
        await tabService.updateTab(tabToUpdate.id, { title: event.newTitle });
      }
    };

    const handleThreadDelete = async (event: { threadId: string }) => {
      const tabToDelete = tabs.find((tab) => tab.threadId === event.threadId);
      if (tabToDelete) {
        await tabService.deleteTab(tabToDelete.id);
      }
    };

    const handleThreadDeleteAll = async (event: { threadIds: string[] }) => {
      const tabsToDelete = event.threadIds
        .map((threadId) => tabs.find((tab) => tab.threadId === threadId))
        .filter((tab) => tab !== undefined);

      if (tabsToDelete.length > 0) {
        try {
          await Promise.all(
            tabsToDelete.map((tab) => tabService.deleteTab(tab.id)),
          );
        } catch (error) {
          logger.error("Error deleting tabs", { error });
        }
      }
    };

    const unsubscribes = [
      emitter.on(EventNames.THREAD_RENAME, handleThreadRename),
      emitter.on(EventNames.THREAD_DELETE, handleThreadDelete),
      emitter.on(EventNames.THREAD_DELETE_ALL, handleThreadDeleteAll),
    ];

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [tabs]);

  return {
    ref,
    handleTabClose,
    handleTabReload,
    onDragStart: () => {
      setActiveTabId(id);
    },
    handleTabCloseAll,
  };
}
