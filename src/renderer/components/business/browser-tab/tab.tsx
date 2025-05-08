import { X } from "lucide-react";
import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";
import { useRef } from "react";
import { useBrowserTabStore } from "@renderer/store/browser-tab/browser-tab-store";

/**
 * * The implementation of Drag and Drop Tab is referenced https://react-dnd.github.io/react-dnd/examples/sortable/simple
 */

interface TabProps {
  id: string;
  index: number;
  title: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  width: number;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function Tab({
  id,
  index,
  title,
  isActive,
  onClick,
  onClose,
  moveTab,
  width,
}: TabProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { draggingTabId, setDraggingTabId, setActiveTabId } =
    useBrowserTabStore();

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

  drag(drop(ref));

  const isCompressed = width < 150;

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={cn(
        "group relative mt-[5px] flex h-full cursor-pointer select-none items-center rounded-t-[10px] px-3",
        isActive ? "bg-bg" : "bg-transparent hover:bg-hover-primary",
        draggingTabId === id || isDragging ? "opacity-50" : "opacity-100",
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          onClick();
        }
      }}
      style={
        {
          width: `${width}px`,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties
      }
    >
      <span
        className={cn(
          "truncate text-xs",
          isCompressed ? "flex-shrink" : "flex-1",
        )}
      >
        {title}
      </span>
      <Button
        className="size-6"
        intent="plain"
        size="square-petite"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
