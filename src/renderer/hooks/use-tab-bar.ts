import { useCallback, useEffect, useState } from "react";
import { TabType, useTabBarStore } from "../store/tab-bar-store";
import { useNavigate } from "react-router-dom";
import { emitter } from "../services/event-service";
import { EventNames } from "../services/event-service";
import { DropResult } from "@hello-pangea/dnd";

interface UseTabBarProps {
  tabBarRef: React.RefObject<HTMLDivElement>;
}

export function useTabBar({ tabBarRef }: UseTabBarProps) {
  const { tabs, activeTabId, addTab, removeTab, moveTab, setActiveTabId } =
    useTabBarStore();

  const navigate = useNavigate();

  const [tabWidth, setTabWidth] = useState<number>(200);

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

    moveTab(result.source.index, result.destination.index);
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

  /**
   * * This effect is used to set the active tab id to the first tab if it is not set
   * * and to set the isLoaded to true
   */
  useEffect(() => {
    const state = useTabBarStore.getState();

    if (!state.isLoaded) {
      if (state.tabs.length > 0 && !state.activeTabId) {
        state.setActiveTabId(state.tabs[0].id);
      }
      state.setIsLoaded(true);
    }
  }, []);

  /**
   * * This effect is used to navigate to the active tab
   */
  useEffect(() => {
    const unsub = useTabBarStore.subscribe((state, prevState) => {
      if (state.activeTabId !== prevState.activeTabId) {
        const tab = state.tabs.find((tab) => tab.id === state.activeTabId);
        if (tab) {
          navigate(
            tab.type === TabType.settings ? "/settings/general-settings" : "/"
          );
        }
      }
    });

    return () => unsub();
  }, [navigate]);

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
    /**
     * Handles the click event for a thread in the sidebar
     * * If the thread is already open, it will be set as the active tab
     * * Else if the thread is not open, it will be added to the tabs and set as the active tab
     * @param threadId The id of the thread to be clicked
     */
    const handleClickThread = (event: {
      id: string;
      title: string;
      favicon: string;
    }) => {
      const { id, title, favicon } = event;
      if (tabs.find((tab) => tab.id === id)) {
        setActiveTabId(id);
      } else {
        addTab({
          title,
          id,
          favicon,
        });
      }
    };
    const unsub = emitter.on(EventNames.THREAD_OPEN, handleClickThread);

    return () => {
      unsub();
    };
  }, [tabs, addTab, setActiveTabId]);

  return {
    tabs,
    activeTabId,
    tabWidth,

    activateTabId,
    handleCloseTab,
    handleDragEnd,
  };
}
