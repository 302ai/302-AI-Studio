import { EventNames, emitter } from "@renderer/services/event-service";
import { useCallback, useEffect, useRef } from "react";
import { useActiveTab } from "./use-active-tab";

interface HookParams {
  id: string;
  index: number;
}

const { tabService } = window.service;

export function useDragableTab({ id }: HookParams) {
  const { setActiveTabId, tabs } = useActiveTab();

  const ref = useRef<HTMLDivElement>(null);

  const handleTabClose = useCallback(async () => {
    try {
      const nextActiveTabId = await tabService.deleteTab(id);
      emitter.emit(EventNames.TAB_CLOSE, { tabId: id, nextActiveTabId });
    } catch (error) {
      console.error("Error closing tab:", error);
    }
  }, [id]);

  const handleTabCloseAll = useCallback(async () => {
    try {
      for (const tab of tabs) {
        await tabService.deleteTab(tab.id);
      }
      emitter.emit(EventNames.TAB_CLOSE_ALL, null);
    } catch (error) {
      console.error("Error closing all tabs:", error);
    }
  }, [tabs]);

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

    const unsubscribes = [
      emitter.on(EventNames.THREAD_RENAME, handleThreadRename),
      emitter.on(EventNames.THREAD_DELETE, handleThreadDelete),
    ];

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [tabs]);

  return {
    ref,
    handleTabClose,
    handleTabCloseAll,
    onDragStart: () => {
      setActiveTabId(id);
    },
    onDragEnd: () => {
      // Drag end logic if needed
    },
  };
}
