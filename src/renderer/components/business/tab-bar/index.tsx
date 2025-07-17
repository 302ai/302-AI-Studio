import { DragDropContext, type DragStart, Droppable } from "@hello-pangea/dnd";
import { Separator } from "@renderer/components/ui/separator";
import { useTabBar } from "@renderer/hooks/use-tab-bar";
import { cn } from "@renderer/lib/utils";
import { EventNames, emitter } from "@renderer/services/event-service";
import type { Thread } from "@shared/triplit/types";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "../button-with-tooltip";
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
  const spaceWidth = 4;

  const calculateTabWidth = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const availableWidth =
      containerWidth - addButtonWidth - spaceWidth * tabs.length;

    const minTabWidth = 0;
    const maxTabWidth = 200;

    const idealWidth = availableWidth / tabs.length;

    const newTabWidth = Math.max(
      minTabWidth,
      Math.min(maxTabWidth, idealWidth),
    );

    setTabWidth(newTabWidth);
  }, [tabs.length]);

  const getPreviousTabIdForActiveTab = useCallback(() => {
    const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    return tabs[activeTabIndex - 1]?.id;
  }, [tabs, activeTabId]);

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
            {tabs.map(({ id, title, type, threadId }, index) => (
              <div key={id} className="relative flex items-center">
                <Separator
                  orientation="vertical"
                  className={cn(
                    "absolute right-[-3px]",
                    "mx-1 h-[20px] w-[2px] self-center transition-opacity duration-300",
                    id === getPreviousTabIdForActiveTab() ||
                      id === activeTabId ||
                      index === tabs.length - 1
                      ? "opacity-0"
                      : "opacity-100",
                  )}
                />
                <Tab
                  className="mr-1"
                  id={id}
                  threadId={threadId ?? ""}
                  index={index}
                  title={type === "setting" ? t("settings.tab-title") : title}
                  isActive={id === activeTabId}
                  onClick={() => activateTabId(id)}
                  type={type}
                  width={tabWidth}
                />
              </div>
            ))}

            <motion.div
              layout
              className="flex items-center"
              animate={{
                opacity: isDragging ? 0 : 1,
              }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
              }}
            >
              <Separator
                orientation="vertical"
                className={cn(
                  "mr-1 h-[20px] w-[2px]",
                  tabs.length === 0 ? "opacity-0" : "opacity-100",
                )}
              />
              <ButtonWithTooltip
                className="!size-6 rounded-[4px]"
                title={t("sidebar.new-thread.tooltip")}
                intent="plain"
                size="sq-xs"
                style={noDragRegion}
                onClick={() => {
                  handleAddNewTab("thread");
                }}
              >
                <Plus className="h-4 w-4" />
              </ButtonWithTooltip>
            </motion.div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
