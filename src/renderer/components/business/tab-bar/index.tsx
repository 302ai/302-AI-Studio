import { DragDropContext, type DragStart, Droppable } from "@hello-pangea/dnd";
import { Separator } from "@renderer/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { useKeyboardShortcuts } from "@renderer/hooks/use-keyboard-shortcuts";
import { useTabBar } from "@renderer/hooks/use-tab-bar";
import { cn } from "@renderer/lib/utils";
import { EventNames, emitter } from "@renderer/services/event-service";
import type { Thread } from "@shared/triplit/types";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tab } from "./tab";

export type TabItem = {
  id: string;
  title: string;
  favicon?: string;
};

const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

const { tabService } = window.service;

export function TabBar() {
  const { t } = useTranslation();

  const {
    tabs,
    activeTabId,
    activateTabId,
    handleDragEnd,
    handleAddNewTab,
    setActiveTabId,
  } = useTabBar();

  const [isDragging, setIsDragging] = useState(false);
  const [tabWidth, setTabWidth] = useState<number>(200);

  const containerRef = useRef<HTMLDivElement>(null);

  const addButtonWidth = 33;
  const separatorWidth = 9;

  const calculateTabWidth = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const availableWidth =
      containerWidth - addButtonWidth - separatorWidth * tabs.length;

    const minTabWidth = 0;
    const maxTabWidth = 200;

    const idealWidth = availableWidth / tabs.length;

    const newTabWidth = Math.max(
      minTabWidth,
      Math.min(maxTabWidth, idealWidth),
    );

    setTabWidth(newTabWidth);
  }, [tabs.length]);

  /**
   * * This effect is used to calculate the width of the tab
   */
  useEffect(() => {
    calculateTabWidth();

    const resizeObserver = new ResizeObserver(() => {
      calculateTabWidth();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateTabWidth]);

  /**
   * * This effect is used to handle the click event for a thread in the sidebar
   */
  useEffect(() => {
    const handleThreadSelect = async (event: { thread: Thread }) => {
      const { id, title } = event.thread;

      const existingTab = tabs.find((tab) => tab.threadId === id);

      if (existingTab) {
        await setActiveTabId(existingTab.id);
      } else {
        const newTab = await tabService.insertTab({
          title,
          threadId: id,
          type: "thread",
        });
        await setActiveTabId(newTab.id);
      }
    };

    const unsub = emitter.on(EventNames.THREAD_SELECT, handleThreadSelect);

    return () => unsub();
  }, [setActiveTabId, tabs]);

  useKeyboardShortcuts("new-chat", () => handleAddNewTab("thread"), true);

  return (
    <DragDropContext
      onDragStart={(start: DragStart) => {
        setIsDragging(true);
        activateTabId(start.draggableId);
      }}
      onDragEnd={(result) => {
        setIsDragging(false);
        handleDragEnd(result);
      }}
    >
      <Droppable droppableId="tab-bar" direction="horizontal">
        {(provided) => (
          <div
            className="flex h-full flex-1 flex-row overflow-hidden"
            ref={(node) => {
              containerRef.current = node;
              provided.innerRef(node);
            }}
            {...provided.droppableProps}
          >
            {tabs.map(({ id, title, type }, index) => (
              <div key={id} className="flex items-center">
                <Separator
                  orientation="vertical"
                  className={cn(
                    "mx-1 h-[20px] w-[1px] self-center transition-opacity duration-200",
                    index === 0 ||
                      tabs[index - 1].id === activeTabId ||
                      id === activeTabId
                      ? "opacity-0"
                      : "opacity-100",
                  )}
                />

                <Tab
                  id={id}
                  index={index}
                  title={type === "setting" ? t("settings.tab-title") : title}
                  isActive={id === activeTabId}
                  onClick={() => activateTabId(id)}
                  type={type}
                  width={tabWidth}
                />
              </div>
            ))}
            <div
              className={cn("flex items-center", {
                "opacity-0": isDragging,
              })}
            >
              <Separator
                orientation="vertical"
                className={cn(
                  "mx-1 h-[20px] w-[1px]",
                  tabs.length === 0 ? "opacity-0" : "opacity-100",
                )}
              />
              <Tooltip>
                <TooltipTrigger
                  className="size-6 flex-shrink-0 self-center"
                  intent="plain"
                  shape="circle"
                  size="square-petite"
                  style={noDragRegion}
                  onClick={() => {
                    handleAddNewTab("thread");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  {t("sidebar.new-thread.tooltip")}
                </TooltipContent>
              </Tooltip>
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
