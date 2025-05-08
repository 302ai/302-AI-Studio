import { useRef, useEffect, useState, useCallback } from "react";
import { Tab } from "./tab";
import {
  TabType,
  useBrowserTabStore,
} from "@renderer/store/browser-tab/browser-tab-store";
import { useNavigate } from "react-router-dom";

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
    <div className="flex rounded-t-lg bg-gray-200">
      <div ref={tabsContainerRef} className="relative flex flex-1">
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            id={tab.id}
            index={index}
            title={tab.title}
            isActive={tab.id === activeTabId}
            onClick={() => setActiveTabId(tab.id)}
            onClose={() => removeTab(tab.id)}
            width={tabWidth}
            moveTab={moveTab}
          />
        ))}
      </div>
    </div>
  );
}
