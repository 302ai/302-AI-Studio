import { useSidebar } from "@renderer/components/ui/sidebar";
import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import { useCallback } from "react";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

const { tabService, threadService, uiService } = window.service;

export function useGlobalShortcuts() {
  const { tabs, activeTabId } = useActiveTab();
  const { activeThreadId } = useActiveThread();
  const { toggleSidebar } = useSidebar();

  const handleCloseCurrentTab = useCallback(async () => {
    if (!activeTabId) return;

    try {
      const nextActiveTabId = await tabService.deleteTab(activeTabId);
      emitter.emit(EventNames.TAB_CLOSE, {
        tabId: activeTabId,
        nextActiveTabId,
      });
    } catch (error) {
      logger.error("Error closing current tab", { error });
    }
  }, [activeTabId]);

  const handleCloseOtherTabs = useCallback(async () => {
    if (!activeTabId || tabs.length <= 1) return;

    try {
      const otherTabIds = tabs
        .filter((tab) => tab.id !== activeTabId)
        .map((tab) => tab.id);

      await Promise.all(
        otherTabIds.map((tabId) => tabService.deleteTab(tabId)),
      );

      otherTabIds.forEach((tabId) => {
        emitter.emit(EventNames.TAB_CLOSE, {
          tabId,
          nextActiveTabId: activeTabId,
        });
      });
    } catch (error) {
      logger.error("Error closing other tabs", { error });
    }
  }, [activeTabId, tabs]);

  const handleDeleteCurrentThread = useCallback(async () => {
    if (!activeThreadId) return;

    try {
      await threadService.deleteThread(activeThreadId);
      emitter.emit(EventNames.THREAD_DELETE, { threadId: activeThreadId });
    } catch (error) {
      logger.error("Error deleting current thread", { error });
    }
  }, [activeThreadId]);

  const handleOpenSettings = useCallback(async () => {
    try {
      const existingSettingTab = tabs.find((tab) => tab.type === "setting");

      if (existingSettingTab) {
        await tabService.activateTab(existingSettingTab.id);
        await uiService.updateActiveTabId(existingSettingTab.id);
      } else {
        const newTab = await tabService.insertTab({
          type: "setting",
          title: "Settings",
          threadId: "",
          path: "/settings/general-settings",
        });

        await tabService.activateTab(newTab.id);
        await uiService.updateActiveTabId(newTab.id);
      }
    } catch (error) {
      logger.error("Error opening settings", { error });
    }
  }, [tabs]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  useKeyboardShortcuts("close-current-tab", handleCloseCurrentTab, true);
  useKeyboardShortcuts("close-other-tabs", handleCloseOtherTabs, true);
  useKeyboardShortcuts(
    "delete-current-thread",
    handleDeleteCurrentThread,
    true,
  );
  useKeyboardShortcuts("open-settings", handleOpenSettings, true);
  useKeyboardShortcuts("toggle-sidebar", handleToggleSidebar, true);

  return {
    handleCloseCurrentTab,
    handleCloseOtherTabs,
    handleDeleteCurrentThread,
    handleOpenSettings,
    handleToggleSidebar,
  };
}
