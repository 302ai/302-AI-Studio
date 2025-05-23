import { EventNames, emitter } from "@renderer/services/event-service";
import { useTabBarStore } from "@renderer/store/tab-bar-store";
import { useEffect, useRef } from "react";

interface HookParams {
  id: string;
  index: number;
}

export function useDragableTab({ id }: HookParams) {
  const { tabs, setDraggingTabId, setActiveTabId, updateTab, removeTab } =
    useTabBarStore();

  const ref = useRef<HTMLDivElement>(null);

  const handleTabClose = () => {
    const nextActiveId = removeTab(id);

    emitter.emit(EventNames.TAB_CLOSE, { tabId: id, nextActiveId });
  };

  const handleTabCloseAll = () => {
    tabs.forEach((tab) => {
      removeTab(tab.id);
    });

    emitter.emit(EventNames.TAB_CLOSE_ALL, null);
  };

  useEffect(() => {
    /**
     * Handle thread rename
     * @param event The event object containing the threadId and newTitle
     */
    const handleThreadRename = (event: {
      threadId: string;
      newTitle: string;
    }) => {
      const tabToUpdate = tabs.find((tab) => tab.id === event.threadId);
      if (tabToUpdate) {
        updateTab(tabToUpdate.id, { title: event.newTitle });
      }
    };

    /**
     * Handle thread delete
     * @param event The event object containing the threadId
     */
    const handleThreadDelete = (event: { threadId: string }) => {
      const tabToDelete = tabs.find((tab) => tab.id === event.threadId);
      if (tabToDelete) {
        removeTab(tabToDelete.id);
      }
    };

    const unsubscribes = [
      emitter.on(EventNames.THREAD_RENAME, handleThreadRename),
      emitter.on(EventNames.THREAD_DELETE, handleThreadDelete),
    ];

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [tabs, updateTab, removeTab]);

  return {
    ref,
    handleTabClose,
    handleTabCloseAll,
    onDragStart: () => {
      setActiveTabId(id);
      setDraggingTabId(id);
    },
    onDragEnd: () => {
      setDraggingTabId(null);
    },
  };
}
