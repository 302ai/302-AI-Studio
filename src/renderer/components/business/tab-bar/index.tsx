import { DragDropContext, type DragStart, Droppable } from "@hello-pangea/dnd";
import { Separator } from "@renderer/components/ui/separator";
import { useTabBar } from "@renderer/hooks/use-tab-bar";
import { cn } from "@renderer/lib/utils";
import { TabType } from "@renderer/store/tab-bar-store";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Tab } from "./tab";

export type TabItem = {
  id: string;
  title: string;
  favicon?: string;
};

export function TabBar() {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const {
    tabs,
    activeTabId,
    tabWidth,

    activateTabId,
    handleDragEnd,
  } = useTabBar({
    tabBarRef: ref as React.RefObject<HTMLDivElement>,
  });

  return (
    <DragDropContext
      onDragStart={(start: DragStart) => activateTabId(start.draggableId)}
      onDragEnd={handleDragEnd}
    >
      <Droppable droppableId="tab-bar" direction="horizontal">
        {(provided) => (
          <div
            className="flex h-full flex-1 flex-row overflow-hidden"
            ref={(node) => {
              ref.current = node;
              provided.innerRef(node);
            }}
            {...provided.droppableProps}
          >
            {tabs.map(({ id, title, favicon, type }, index) => (
              <div key={id} className="flex items-center">
                <Separator
                  orientation="vertical"
                  className={cn(
                    "h-[20px] w-[1px] self-center transition-opacity duration-200",
                    index === 0 ||
                      tabs[index - 1].id === activeTabId ||
                      id === activeTabId
                      ? "opacity-0"
                      : "opacity-100"
                  )}
                />

                <Tab
                  id={id}
                  index={index}
                  title={
                    type === TabType.settings ? t("settings.tab-title") : title
                  }
                  isActive={id === activeTabId}
                  onClick={() => activateTabId(id)}
                  width={tabWidth}
                  favicon={favicon}
                  type={type}
                />
              </div>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
