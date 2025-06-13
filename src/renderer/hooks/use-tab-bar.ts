import type { DropResult } from "@hello-pangea/dnd";
import { triplitClient } from "@shared/triplit/client";
import type { Tab, Thread } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventNames, emitter } from "../services/event-service";
import { useActiveTab } from "./use-active-tab";

interface UseTabBarProps {
  tabBarRef: React.RefObject<HTMLDivElement>;
}

const { tabService } = window.service;

export function useTabBar({ tabBarRef }: UseTabBarProps) {
  const { activeTabId, activeTab, setActiveTabId } = useActiveTab();

  const tabsQuery = triplitClient.query("tabs").Order("order", "ASC");
  const { results: alltabs } = useQuery(triplitClient, tabsQuery);

  const navigate = useNavigate();

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [tabWidth, setTabWidth] = useState<number>(200);

  const activateTabId = (id: string) => {
    setActiveTabId(id);

    emitter.emit(EventNames.TAB_SELECT, { tabId: id });
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    if (result.source.index === result.destination.index) {
      return;
    }

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    const newTabs = [...tabs];
    const [movedTab] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, movedTab);
    setTabs(newTabs);

    try {
      await tabService.moveTab(fromIndex, toIndex, tabs);
      console.log("Tab order updated successfully");
    } catch (error) {
      console.error("Failed to move tab:", error);
      setTabs(tabs);
    }
  };

  const calculateTabWidth = useCallback(() => {
    if (!tabBarRef.current) return;

    const containerWidth = tabBarRef.current.clientWidth;
    const bufferSpace = 20;
    const availableWidth = containerWidth - bufferSpace;

    const minTabWidth = 32;
    const maxTabWidth = 200;

    const idealWidth = availableWidth / tabs.length;

    const newTabWidth = Math.max(
      minTabWidth,
      Math.min(maxTabWidth, idealWidth),
    );

    setTabWidth(newTabWidth);
  }, [tabs.length, tabBarRef.current]);

  useEffect(() => {
    setTabs(alltabs || []);
  }, [alltabs]);

  /**
   * * This effect is used to navigate to the home page if the tabs are empty
   */
  useEffect(() => {
    if (tabs.length === 0) {
      navigate("/");
    }
  }, [tabs, navigate]);

  /**
   * * This effect is used to navigate to the active tab
   */
  useEffect(() => {
    if (activeTab) {
      navigate(
        activeTab.type === "setting" ? "/settings/general-settings" : "/",
      );
    }
  }, [activeTab, navigate]);

  /**
   * * This effect is used to calculate the width of the tab
   */
  useEffect(() => {
    calculateTabWidth();

    const resizeObserver = new ResizeObserver(() => {
      calculateTabWidth();
    });

    if (tabBarRef.current) {
      resizeObserver.observe(tabBarRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateTabWidth, tabBarRef.current]);

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

  return {
    tabs,
    activeTabId,
    tabWidth,

    activateTabId,
    handleDragEnd,
  };
}
