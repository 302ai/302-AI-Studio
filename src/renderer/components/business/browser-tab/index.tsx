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
    addTab,
    removeTab,
    moveTab,
    setActiveTabId,
    setIsLoaded,
  } = useBrowserTabStore();

  const navigate = useNavigate();

  const [tabWidth, setTabWidth] = useState<number>(200);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded) {
      if (tabs.length > 0 && !activeTabId) {
        setActiveTabId(tabs[0].id);
      }
      setIsLoaded(true);
    }
  }, [isLoaded, tabs, activeTabId, setActiveTabId, setIsLoaded]);

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

  const handleTabClick = (id: string, type: TabType) => {
    if (type === TabType.settings) {
      navigate("/settings/general-settings");
    } else {
      navigate("/");
    }
    setActiveTabId(id);
  };

  const handleTabClose = async (id: string, type: TabType) => {
    if (type === TabType.settings) {
      navigate("/");
    }
    removeTab(id);
  };

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
            onClick={() => handleTabClick(tab.id, tab.type)}
            onClose={() => handleTabClose(tab.id, tab.type)}
            width={tabWidth}
            moveTab={moveTab}
          />
        ))}
      </div>
    </div>
  );
}
