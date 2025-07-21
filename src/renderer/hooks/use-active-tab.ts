import { triplitClient } from "@renderer/client";
import logger from "@shared/logger/renderer-logger";
import type { Tab } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useEffect, useState } from "react";

const { uiService } = window.service;

export function useActiveTab() {
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);

  const uiQuery = triplitClient.query("ui");
  const { results: uiResults } = useQuery(triplitClient, uiQuery);

  const tabsQuery = triplitClient.query("tabs").Order("order", "ASC");
  const { results: tabs } = useQuery(triplitClient, tabsQuery);

  const activeTabId = uiResults?.[0]?.activeTabId || null;
  const activeTabHistory = Array.from(uiResults?.[0]?.activeTabHistory || []);
  const activeTab = tabs?.find((t) => t.id === activeTabId);

  const setActiveTabId = useCallback(async (tabId: string) => {
    logger.debug("useActiveTab: Setting active tab ID with history", {
      tabId: tabId || "none",
    });
    await uiService.updateActiveTabId(tabId);
    await uiService.updateActiveTabHistory(tabId);
  }, []);

  useEffect(() => {
    if (!activeTabId || !activeTab) {
      setSelectedTab(null);
      return;
    }

    setSelectedTab(activeTab || null);
  }, [activeTabId, activeTab]);

  return {
    selectedTab,
    activeTab,
    activeTabId,
    activeTabHistory,
    tabs: tabs || [],
    setActiveTabId,
  };
}
