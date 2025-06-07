import { updateActiveTabHistory, updateActiveTabId } from "@renderer/services/db-services/ui-db-service";
import { triplitClient } from "@shared/triplit/client";
import type { Tab } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useEffect, useState } from "react";

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
    console.log("Setting active tab ID with history:", tabId || "none");
    await updateActiveTabId(tabId);
    await updateActiveTabHistory(tabId);
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
