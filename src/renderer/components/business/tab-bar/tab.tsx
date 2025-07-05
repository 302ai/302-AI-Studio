/** biome-ignore-all lint/a11y/useSemanticElements: ignore seSemanticElements */
import { Draggable } from "@hello-pangea/dnd";
import placeholder from "@renderer/assets/llm-icons/logo.png?url";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@renderer/components/ui/context-menu";
import { useDragableTab } from "@renderer/hooks/use-dragable-tab";
import { cn } from "@renderer/lib/utils";
import { CopyX, Settings2, X } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface TabProps {
  id: string;
  index: number;
  title: string;
  isActive: boolean;
  onClick: () => void;
  type: "thread" | "setting";
  isDragging: boolean;
}
const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function Tab({
  id,
  index,
  title,
  isActive,
  onClick,
  type,
  isDragging,
}: TabProps) {
  const { t } = useTranslation();
  const { ref, handleTabClose, handleTabCloseAll } = useDragableTab({
    id,
    index,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(200);

  const updateWidth = useCallback(() => {
    if (containerRef.current && !isDragging) {
      setWidth(containerRef.current.offsetWidth);
    }
  }, [isDragging]);

  useEffect(() => {
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateWidth]);

  // * The three different compression states for the tab
  const isCompressedOne = width <= 100;
  const isCompressedTwo = width <= 80;
  const isCompressedThree = width <= 50;

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <ContextMenu>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            exit={{ width: 0 }}
            transition={{ duration: 0.3 }}
            className="size-full"
          >
            <ContextMenuTrigger className="size-full p-1">
              <div
                ref={(node) => {
                  ref.current = node;
                  provided.innerRef(node);
                  containerRef.current = node;
                }}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={cn(
                  "relative flex h-full w-full select-none items-center rounded-full",
                  isCompressedThree
                    ? "justify-center px-0"
                    : "justify-between px-2",
                  isActive ? "bg-bg" : "bg-transparent hover:bg-hover-primary",
                  snapshot.isDragging ? "opacity-50" : "opacity-100",
                )}
                onClick={onClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onClick();
                  }
                }}
                role="button"
                tabIndex={0}
                style={
                  {
                    ...noDragRegion,
                    ...provided.draggableProps.style,
                    cursor: "pointer",
                  } as React.CSSProperties
                }
              >
                {isCompressedThree ? (
                  <div className="relative flex items-center justify-center">
                    {!isActive ? (
                      type === "setting" ? (
                        <Settings2 className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <img
                          src={placeholder}
                          alt="favicon"
                          className="h-4 w-4 flex-shrink-0"
                        />
                      )
                    ) : (
                      <X
                        className="absolute size-5 shrink-0 rounded-full p-1 hover:bg-hover-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTabClose();
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <>
                    {type === "setting" ? (
                      <Settings2
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isCompressedTwo ? "mr-0" : "mr-2",
                        )}
                      />
                    ) : (
                      <img
                        src={placeholder}
                        alt="favicon"
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isCompressedTwo ? "mr-0" : "mr-2",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "truncate text-left text-xs",
                        isCompressedOne ? "flex-shrink" : "flex-1",
                      )}
                    >
                      {title}
                    </span>
                    <X
                      className={cn(
                        "shrink-0 rounded-full p-1",
                        isActive
                          ? "hover:bg-hover-primary"
                          : "hover:bg-hover-secondary",
                        isCompressedTwo ? "size-5" : "size-6",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTabClose();
                      }}
                    />
                  </>
                )}
              </div>
            </ContextMenuTrigger>
          </motion.div>
          <ContextMenuContent aria-label={`Tab options for ${title}`}>
            <ContextMenuItem onAction={handleTabClose}>
              <X className="mr-2 h-4 w-4" />
              {t("tab-bar.menu-item.close")}
            </ContextMenuItem>
            <ContextMenuItem onAction={handleTabCloseAll}>
              <CopyX className="mr-2 h-4 w-4" />
              {t("tab-bar.menu-item.close-all")}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )}
    </Draggable>
  );
}
