import { useRef, useEffect, useState, useCallback } from "react";
import { Tab } from "./tab";
import {
  TabType,
  useBrowserTabStore,
} from "@/src/renderer/store/browser-tab-store";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Separator } from "@renderer/components/ui/separator";
import { cn } from "@renderer/lib/utils";

export type TabItem = {
  id: string;
  title: string;
  favicon?: string;
};

export function BrowserTabs() {
  const { t } = useTranslation();

  const {
    tabs,
    activeTabId,
    isLoaded,
    removeTab,
    moveTab,
    setActiveTabId,
    setIsLoaded,
  } = useBrowserTabStore();

  const navigate = useNavigate();

  const [tabWidth, setTabWidth] = useState<number>(200);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleMoveTab = (dragIndex: number, hoverIndex: number) => {
    moveTab(dragIndex, hoverIndex);
  };

  const handleClickTab = (id: string) => {
    setActiveTabId(id);
  };

  const handleCloseTab = (id: string) => {
    removeTab(id);

    // Get the new tabs length after removing the tab immediately
    const newTabsLength = useBrowserTabStore.getState().tabs.length;
    if (newTabsLength === 0) {
      navigate("/");
    }
  };

  const calculateTabWidth = useCallback(() => {
    if (!tabsContainerRef.current) return;

    const containerWidth = tabsContainerRef.current.clientWidth;
    const bufferSpace = 20;
    const availableWidth = containerWidth - bufferSpace;

    const minTabWidth = 32;
    const maxTabWidth = 200;

    const idealWidth = availableWidth / tabs.length;

    const newTabWidth = Math.max(
      minTabWidth,
      Math.min(maxTabWidth, idealWidth)
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
          tab.type === TabType.settings ? "/settings/general-settings" : "/"
        );
      }
    }
  }, [activeTabId, navigate, tabs]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="flex h-full flex-1 flex-row overflow-hidden"
        ref={tabsContainerRef}
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
