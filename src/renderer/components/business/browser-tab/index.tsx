import { useRef, useEffect, useState, useCallback } from "react";
import { Tab } from "./tab";
import {
  TabType,
  useBrowserTabStore,
} from "@renderer/store/browser-tab/browser-tab-store";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Separator } from "@renderer/components/ui/separator";
import { cn } from "@renderer/lib/utils";

export type TabItem = {
  id: string;
  title: string;
};

export function BrowserTabs() {
  const {
    tabs,
    activeTabId,
    isLoaded,
    removeTab,
    moveTab,
    setActiveTabId,
    setIsLoaded,
  } = useBrowserTabStore();
  const { t } = useTranslation();

  const navigate = useNavigate();

  const [tabWidth, setTabWidth] = useState<number>(200);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const calculateTabWidth = useCallback(() => {
    if (!tabsContainerRef.current) return;

    const containerWidth = tabsContainerRef.current.clientWidth;
    const buttonWidth = 80;
    const availableWidth = containerWidth - buttonWidth;

    const minTabWidth = 100;
    const maxTabWidth = 200;

    const idealWidth = availableWidth / tabs.length;

    const newTabWidth = Math.max(
      minTabWidth,
      Math.min(maxTabWidth, idealWidth),
    );

    setTabWidth(newTabWidth);
  }, [tabs.length]);

  const handleMoveTab = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      moveTab(dragIndex, hoverIndex);
    },
    [moveTab],
  );

  // useEffect(() => {
  //   calculateTabWidth();
  //   window.addEventListener("resize", calculateTabWidth);
  //   return () => window.removeEventListener("resize", calculateTabWidth);
  // }, [calculateTabWidth]);

  useEffect(() => {
    if (!isLoaded) {
      if (tabs.length > 0 && !activeTabId) {
        setActiveTabId(tabs[0].id);
      }
      setIsLoaded(true);
    }
  }, [isLoaded, tabs, activeTabId, setActiveTabId, setIsLoaded]);

  useEffect(() => {
    if (activeTabId) {
      const tab = tabs.find((tab) => tab.id === activeTabId);
      if (tab) {
        navigate(
          tab.type === TabType.settings ? "/settings/general-settings" : "/",
        );
      }
    }
  }, [activeTabId, navigate, tabs]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full flex-row px-2">
        <div ref={tabsContainerRef} className="relative flex flex-1">
          {tabs.map((tab, index) => (
            <div key={tab.id} className="flex items-center">
              {index > 0 && (
                <Separator
                  orientation="vertical"
                  className={cn(
                    "h-[20px] w-[1px] self-center transition-opacity duration-200",
                    tabs[index - 1].id === activeTabId || tab.id === activeTabId
                      ? "opacity-0"
                      : "opacity-100",
                  )}
                />
              )}
              <Tab
                id={tab.id}
                index={index}
                title={
                  tab.type === TabType.settings
                    ? t("settings.tab-title")
                    : tab.title
                }
                isActive={tab.id === activeTabId}
                onClick={() => setActiveTabId(tab.id)}
                onClose={() => removeTab(tab.id)}
                width={tabWidth}
                moveTab={handleMoveTab}
              />
            </div>
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
