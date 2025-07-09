/** biome-ignore-all lint/a11y/useSemanticElements: ignore semantic elements */
import { Draggable } from "@hello-pangea/dnd";
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
import { useTranslation } from "react-i18next";

interface TabProps {
  id: string;
  index: number;
  title: string;
  isActive: boolean;
  onClick: () => void;
  width: number;
  type: "thread" | "setting";
}
const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function Tab({
  id,
  index,
  title,
  isActive,
  onClick,
  width,
  type,
}: TabProps) {
  const { t } = useTranslation();
  const { ref, handleTabClose, handleTabCloseAll } = useDragableTab({
    id,
    index,
  });

  // * The three different compression states for the tab
  const isCompressedOne = width <= 100;
  const isCompressedTwo = width <= 80;
  const isCompressedThree = width <= 50;

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <ContextMenu>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-[80%]"
          >
            <ContextMenuTrigger className="size-full">
              <div
                ref={(node) => {
                  ref.current = node;
                  provided.innerRef(node);
                }}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={cn(
                  "relative mt-[1px] flex h-full select-none items-center rounded-[10px] px-3",
                  isCompressedThree
                    ? "justify-center px-0"
                    : "justify-between px-2",
                  isActive
                    ? "bg-accent text-accent-fg"
                    : "hover:bg-hover hover:text-hover-fg",
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
                    width: `${width}px`,
                    minWidth: `${width}px`,
                    maxWidth: `${width}px`,
                    ...noDragRegion,
                    ...provided.draggableProps.style,
                    cursor: "pointer",
                  } as React.CSSProperties
                }
              >
                {isCompressedThree ? (
                  !isActive ? (
                    type === "setting" ? (
                      <Settings2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <span className="flex-1 truncate text-xs">{title}</span>
                    )
                  ) : (
                    <X
                      className="absolute size-5 shrink-0 rounded-[4px] p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTabClose();
                      }}
                    />
                  )
                ) : (
                  <>
                    {type === "setting" && (
                      <Settings2
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
                        "shrink-0 rounded-[4px] p-1",
                        isActive ? "hover:bg-accent-hover" : "hover:bg-hover-2",
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
