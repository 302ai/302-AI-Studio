import { useCallback, useEffect, useState } from "react";
import { TabType, useTabBarStore } from "../store/tab-bar-store";
import { useNavigate } from "react-router-dom";
import { useThreadsStore } from "../store/threads-store";
import { emitter } from "../services/event-service";
import { EventNames } from "../services/event-service";
import { DropResult } from "@hello-pangea/dnd";

interface UseTabBarProps {
  tabBarRef: React.RefObject<HTMLDivElement>;
}

export function useTabBar({ tabBarRef }: UseTabBarProps) {
  const {
    tabs,
    activeTabId,
    isLoaded,
    addTab,
    removeTab,
    moveTab,
    setActiveTabId,
    setIsLoaded,
  } = useTabBarStore();
  const { threads } = useThreadsStore();

  const navigate = useNavigate();

  const [tabWidth, setTabWidth] = useState<number>(200);

  const handleMoveTab = (dragIndex: number, hoverIndex: number) => {
    moveTab(dragIndex, hoverIndex);
  };

  const activateTabId = (id: string) => {
    setActiveTabId(id);
  };

  const handleCloseTab = (id: string) => {
    removeTab(id);

    // Get the new tabs length after removing the tab immediately
    const newTabsLength = useTabBarStore.getState().tabs.length;
    if (newTabsLength === 0) {
      navigate("/");
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    handleMoveTab(result.source.index, result.destination.index);
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
      Math.min(maxTabWidth, idealWidth)
    );

    setTabWidth(newTabWidth);
  }, [tabs.length, tabBarRef.current]);

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

  useEffect(() => {
    /**
     * Handles the click event for a thread in the sidebar
     * * If the thread is already open, it will be set as the active tab
     * * Else if the thread is not open, it will be added to the tabs and set as the active tab
     * @param threadId The id of the thread to be clicked
     */
    const handleClickThread = (event: { threadId: string }) => {
      const { threadId } = event;
      if (tabs.find((tab) => tab.id === threadId)) {
        setActiveTabId(threadId);
      } else {
        const currentThread = threads.find((thread) => thread.id === threadId);
        if (currentThread) {
          addTab({
            title: currentThread.title,
            id: currentThread.id,
          });
        }
      }
    };
    const unsub = emitter.on(EventNames.THREAD_OPEN, handleClickThread);

    return () => {
      unsub();
    };
  }, [tabs, addTab, setActiveTabId, threads]);

  return {
    tabs,
    activeTabId,
    tabWidth,

    activateTabId,
    handleCloseTab,
    handleDragEnd,
  };
}
