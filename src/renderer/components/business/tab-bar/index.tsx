import { DragDropContext, type DragStart, Droppable } from "@hello-pangea/dnd";
import { Separator } from "@renderer/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { useTabBar } from "@renderer/hooks/use-tab-bar";
import { cn } from "@renderer/lib/utils";
import { EventNames, emitter } from "@renderer/services/event-service";
import type { Thread } from "@shared/triplit/types";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);

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

  return (
    <DragDropContext
      onDragStart={(start: DragStart) => {
        setIsDragging(true);
        setDraggingTabId(start.draggableId);
        activateTabId(start.draggableId);
      }}
      onDragEnd={(result) => {
        setIsDragging(false);
        setDraggingTabId(null);
        handleDragEnd(result);
      }}
    >
      <Droppable droppableId="tab-bar" direction="horizontal">
        {(provided) => (
          <div
            className="flex h-full flex-1 flex-row overflow-hidden"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tabs.map(({ id, title, type }, index) => (
              <div
                key={id}
                className={cn(
                  "flex items-center",
                  draggingTabId === id ? "" : "min-w-8 max-w-52 flex-1",
                )}
              >
                <Separator
                  orientation="vertical"
                  className={cn(
                    "h-[20px] w-[1px] self-center transition-opacity duration-200",
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
                  isDragging={isDragging}
                />
              </div>
            ))}
            <div
              className={cn("flex items-center", {
                "opacity-0": isDragging || tabs.length === 0,
              })}
            >
              <Separator
                orientation="vertical"
                className="h-[20px] w-[1px] self-center"
              />
              <Tooltip>
                <TooltipTrigger
                  className="ml-1 size-6 flex-shrink-0 self-center"
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
