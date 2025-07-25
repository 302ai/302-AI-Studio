/** biome-ignore-all lint/a11y/useSemanticElements: ignore semantic elements */
import { Draggable } from "@hello-pangea/dnd";
import { triplitClient } from "@renderer/client";
import { ContextMenu } from "@renderer/components/ui/context-menu";
import { useDragableTab } from "@renderer/hooks/use-dragable-tab";
import { cn } from "@renderer/lib/utils";
import type { TabType } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import { CopyX, RotateCw, X } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ShrinkableTab } from "./shrinkable-tab";

interface TabProps {
  className?: string;
  tabId: string;
  threadId: string;
  index: number;
  title: string;
  isActive: boolean;
  onClick: () => void;
  width: number;
  type: TabType;
  isPrivate?: boolean;
}
const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function Tab({
  className,
  tabId,
  threadId,
  index,
  title,
  isActive,
  onClick,
  width,
  type,
  isPrivate = false,
}: TabProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "tab-bar.menu-item",
  });
  const { ref, handleTabClose, handleTabCloseAll, handleTabReload } =
    useDragableTab({
      id: tabId,
      index,
    });

  const threadStatusQuery = triplitClient
    .query("threads")
    .Id(threadId)
    .Include("messages");
  const { result: thread } = useQueryOne(triplitClient, threadStatusQuery);

  const latestAssistantMessage = thread?.messages
    .filter((message) => message.role === "assistant")
    .sort((a, b) => b.orderSeq - a.orderSeq)[0];

  const isStreaming = latestAssistantMessage?.status === "pending";
  const isAiToolTab = type === "302ai-tool";

  // * The three different compression states for the tab
  const isShrinkedThree = width <= 50;

  return (
    <Draggable draggableId={tabId} index={index}>
      {(provided, snapshot) => (
        <ContextMenu>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-[74%]"
          >
            <ContextMenu.Trigger className="size-full">
              <div
                ref={(node) => {
                  ref.current = node;
                  provided.innerRef(node);
                }}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={cn(
                  "relative flex h-full select-none items-center rounded-[10px]",
                  isShrinkedThree
                    ? "justify-center px-1"
                    : "justify-between px-3",
                  isActive
                    ? "bg-accent text-accent-fg"
                    : "hover:bg-hover hover:text-hover-fg",
                  snapshot.isDragging ? "opacity-50" : "opacity-100",
                  className,
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
                <ShrinkableTab
                  title={title}
                  isActive={isActive}
                  width={width}
                  type={type}
                  handleTabClose={handleTabClose}
                  streaming={isStreaming}
                  isPrivate={isPrivate}
                />
              </div>
            </ContextMenu.Trigger>
          </motion.div>
          <ContextMenu.Content aria-label={`Tab options for ${title}`}>
            {isAiToolTab && (
              <>
                <ContextMenu.Item onAction={handleTabReload}>
                  <RotateCw className="mr-2 h-4 w-4" />
                  {t("reload")}
                </ContextMenu.Item>
                <ContextMenu.Separator />
              </>
            )}
            <ContextMenu.Item onAction={handleTabClose}>
              <X className="mr-2 h-4 w-4" />
              {t("close")}
            </ContextMenu.Item>
            <ContextMenu.Item onAction={handleTabCloseAll}>
              <CopyX className="mr-2 h-4 w-4" />
              {t("close-all")}
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu>
      )}
    </Draggable>
  );
}
