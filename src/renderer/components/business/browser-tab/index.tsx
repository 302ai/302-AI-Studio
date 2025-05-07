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
    setTabs,
    setActiveTabId,
    addTab,
    removeTab,
    moveTab,
    setIsLoaded,
  } = useBrowserTabStore();

  const navigate = useNavigate();

  const [tabWidth, setTabWidth] = useState<number>(200);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  useEffect(() => {
    const loadTabsFromDB = async () => {
      if (!isLoaded) {
        const defaultTabs = [
          {
            id: "1",
            title: "Google",
            message: "",
            type: TabType.thread,
          },
          {
            id: "2",
            title: "GitHub",
            message: "",
            type: TabType.thread,
          },
          {
            id: "3",
            title: "Vercel",
            message: "",
            type: TabType.thread,
          },
        ];
        setTabs(defaultTabs);
        setActiveTabId("1");
        setIsLoaded(true);
      }
    };

    loadTabsFromDB();
  }, [isLoaded, setActiveTabId, setIsLoaded, setTabs]);

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

  const handleTabClick = (id: string) => {
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
            onClick={() => handleTabClick(tab.id)}
            onClose={() => handleTabClose(tab.id, tab.type)}
            width={tabWidth}
            moveTab={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
