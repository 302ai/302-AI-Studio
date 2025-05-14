import { X } from "lucide-react";
import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";
import { useDrag, useDrop } from "react-dnd";
import type { Identifier, XYCoord } from "dnd-core";
import { useRef } from "react";
import {
  TabType,
  useBrowserTabStore,
} from "@/src/renderer/store/browser-tab-store";
import placeholder from "@renderer/assets/images/provider/302ai.png";
import { Settings2 } from "lucide-react";

/**
 * * The implementation of Drag and Drop Tab is referenced https://react-dnd.github.io/react-dnd/examples/sortable/simple
 */

interface TabProps {
  id: string;
  index: number;
  title: string;
  favicon?: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  width: number;
  type: TabType;
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
  favicon,
  isActive,
  onClick,
  onClose,
  moveTab,
  width,
  type,
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

  const isCompressedOne = width <= 100;
  const isCompressedTwo = width <= 80;
  const isCompressedThree = width <= 50;

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={cn(
        "relative mt-[5px] flex h-full cursor-pointer select-none items-center rounded-t-[10px] px-3",
        isCompressedThree ? "justify-center px-0" : "justify-between px-2",
        isActive ? "bg-bg" : "bg-transparent hover:bg-hover-primary",
        draggingTabId === id || isDragging ? "opacity-50" : "opacity-100"
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
      {isCompressedThree ? (
        <div className="relative flex items-center justify-center">
          {!isActive ? (
            type === TabType.settings ? (
              <Settings2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <img
                src={favicon || placeholder}
                alt="favicon"
                className="h-4 w-4 flex-shrink-0"
              />
            )
          ) : (
            <Button
              className="absolute size-5"
              intent="plain"
              size="square-petite"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ) : (
        <>
          {type === TabType.settings ? (
            <Settings2
              className={cn(
                "h-4 w-4 flex-shrink-0",
                isCompressedTwo ? "mr-0" : "mr-2"
              )}
            />
          ) : (
            <img
              src={favicon || placeholder}
              alt="favicon"
              className={cn(
                "h-4 w-4 flex-shrink-0",
                isCompressedTwo ? "mr-0" : "mr-2"
              )}
            />
          )}
          <span
            className={cn(
              "truncate text-xs",
              isCompressedOne ? "flex-shrink" : "flex-1"
            )}
          >
            {title}
          </span>
          <Button
            className={cn(isCompressedTwo ? "size-5" : "size-6")}
            intent="plain"
            size="square-petite"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className={cn(isCompressedTwo ? "h-3 w-3" : "h-4 w-4")} />
          </Button>
        </>
      )}
    </div>
  );
}
