import { useTabBarStore } from "../store/tab-bar-store";
import { useEffect, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";
import { emitter, EventNames } from "@renderer/services/event-service";

/**
 * * The implementation of Drag and Drop Tab is referenced https://react-dnd.github.io/react-dnd/examples/sortable/simple
 */

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface HookParams {
  id: string;
  index: number;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
}

export function useDragableTab({ id, index, moveTab }: HookParams) {
  const { tabs, setDraggingTabId, setActiveTabId, updateTab, removeTab } =
    useTabBarStore();

  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "tab",
    item: () => {
      setActiveTabId(id);
      setDraggingTabId(id);
      return { id, index };
    },
    end: () => {
      setDraggingTabId(null);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: "tab",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get horizontal middle
      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the left
      const hoverClientX = (clientOffset as XYCoord).x - hoverBoundingRect.left;

      // Only perform the move when the mouse has crossed half of the items width
      // When dragging right, only move when the cursor is after 50%
      // When dragging left, only move when the cursor is before 50%

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      // Time to actually perform the action
      moveTab(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

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
    handlerId,
    isDragging,
    dragDropRef: (node: HTMLDivElement | null) => {
      drag(drop(node));
      ref.current = node;
    },
  };
}
