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

  const handleMoveTab = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      moveTab(dragIndex, hoverIndex);
    },
    [moveTab],
  );

  const calculateTabWidth = useCallback(() => {
    if (!tabsContainerRef.current) return;

    const containerWidth = tabsContainerRef.current.clientWidth;
    const bufferSpace = 10;
    const availableWidth = containerWidth - bufferSpace;

    console.log("containerWidth", containerWidth);
    console.log("availableWidth", availableWidth);

    const minTabWidth = 50;
    const maxTabWidth = 200;

    const idealWidth = availableWidth / tabs.length;

    const newTabWidth = Math.max(
      minTabWidth,
      Math.min(maxTabWidth, idealWidth),
    );

    setTabWidth(newTabWidth);
  }, [tabs.length]);

  useEffect(() => {
    calculateTabWidth();

    const resizeObserver = new ResizeObserver(() => {
      calculateTabWidth();
    });

    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateTabWidth]);

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
      <div className="flex size-full flex-row px-2">
        <div
          ref={tabsContainerRef}
          className="relative flex flex-1 overflow-hidden"
        >
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
