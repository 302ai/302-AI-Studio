import { VscClose, VscCloseAll } from "react-icons/vsc";
import { cn } from "@renderer/lib/utils";
import { TabType, useTabBarStore } from "@/src/renderer/store/tab-bar-store";
import placeholder from "@renderer/assets/images/provider/302ai.png";
import { Settings2, X } from "lucide-react";
import { useDragableTab } from "@/src/renderer/hooks/use-dragable-tab";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@renderer/components/ui/context-menu";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { draggingTabId } = useTabBarStore();
  const {
    handlerId,
    isDragging,
    dragDropRef,
    handleTabClose,
    handleTabCloseAll,
  } = useDragableTab({
    id,
    index,
    moveTab,
    onClose,
  });

  // * The three different compression states for the tab
  const isCompressedOne = width <= 100;
  const isCompressedTwo = width <= 80;
  const isCompressedThree = width <= 50;

  return (
    <ContextMenu>
      <ContextMenuTrigger className="size-full">
        <div
          ref={dragDropRef}
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
                  "truncate text-left text-xs",
                  isCompressedOne ? "flex-shrink" : "flex-1"
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
                  isCompressedTwo ? "size-5" : "size-6"
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
      <ContextMenuContent aria-label={`Tab options for ${title}`}>
        <ContextMenuItem onAction={handleTabClose}>
          <VscClose className="mr-2 h-4 w-4" />
          {t("tab-bar.menu-item.close")}
        </ContextMenuItem>
        <ContextMenuItem onAction={handleTabCloseAll}>
          <VscCloseAll className="mr-2 h-4 w-4" />
          {t("tab-bar.menu-item.close-all")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
