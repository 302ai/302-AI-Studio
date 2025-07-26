import type { Tab } from "@shared/triplit/types";
import { useMemo } from "react";
import type { QueryConfig } from "../../types";
import { useActiveTabId, useActiveThreadId, useOrderedTabs } from "../index";

/**
 * 标签管理组合Hook
 * 提供标签管理相关的数据和状态
 */
export function useTabManagement(config?: {
  tabs?: QueryConfig<"tabs">;
  ui?: QueryConfig<"ui">;
}) {
  // 获取基础数据
  const { data: tabs, isLoading: tabsLoading } = useOrderedTabs(config?.tabs);
  const { data: activeTabId } = useActiveTabId(config?.ui);
  const { data: activeThreadId } = useActiveThreadId(config?.ui);

  // 计算标签状态
  const tabState = useMemo(() => {
    const allTabs = tabs || [];
    const activeTab = allTabs.find((tab) => tab.id === activeTabId) || null;

    // 按类型分组标签
    const threadTabs = allTabs.filter((tab) => tab.type === "thread");
    const settingTabs = allTabs.filter((tab) => tab.type === "setting");
    const toolTabs = allTabs.filter((tab) => tab.type === "302ai-tool");

    // 查找当前线程对应的标签
    const currentThreadTab =
      threadTabs.find((tab) => tab.threadId === activeThreadId) || null;

    // 标签统计
    const tabCounts = {
      total: allTabs.length,
      thread: threadTabs.length,
      setting: settingTabs.length,
      tool: toolTabs.length,
    };

    return {
      // 基础数据
      allTabs,
      activeTab,
      activeTabId,
      activeThreadId,

      // 分组数据
      threadTabs,
      settingTabs,
      toolTabs,
      currentThreadTab,

      // 统计信息
      tabCounts,

      // 状态标识
      hasActiveTabs: allTabs.length > 0,
      hasActiveTab: !!activeTab,
      hasSettingTab: settingTabs.length > 0,
      hasThreadTabs: threadTabs.length > 0,

      // 便捷查询
      getTabIndex: (tabId: string) =>
        allTabs.findIndex((tab) => tab.id === tabId),
      getTabById: (tabId: string) =>
        allTabs.find((tab) => tab.id === tabId) || null,
      getTabsByType: (type: Tab["type"]) =>
        allTabs.filter((tab) => tab.type === type),
    };
  }, [tabs, activeTabId, activeThreadId]);

  return {
    ...tabState,
    isLoading: tabsLoading,
    isReady: !!tabs,
  };
}
