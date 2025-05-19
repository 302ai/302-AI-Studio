import { useRef } from "react";
import { Tab } from "./tab";
import { TabType, useTabBarStore } from "@/src/renderer/store/tab-bar-store";
import { useTranslation } from "react-i18next";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Separator } from "@renderer/components/ui/separator";
import { cn } from "@renderer/lib/utils";
import { useTabBar } from "@renderer/hooks/use-tab-bar";

export type TabItem = {
  id: string;
  title: string;
  favicon?: string;
};

export function TabBar() {
  const { t } = useTranslation();

  const ref = useRef<HTMLDivElement>(null);

  const { tabs, activeTabId } = useTabBarStore();
  const { tabWidth, handleMoveTab, handleClickTab, handleCloseTab } = useTabBar(
    {
      tabsContainerRef: ref as React.RefObject<HTMLDivElement>,
    }
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full flex-1 flex-row overflow-hidden" ref={ref}>
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
              onClick={() => handleClickTab(id)}
              onClose={() => handleCloseTab(id)}
              width={tabWidth}
              moveTab={handleMoveTab}
              favicon={favicon}
              type={type}
            />
          </div>
        ))}
      </div>
    </DndProvider>
  );
}
