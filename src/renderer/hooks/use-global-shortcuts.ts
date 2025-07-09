import { useSidebar } from "@renderer/components/ui/sidebar";
import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import { useCallback } from "react";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

const { tabService, threadService } = window.service;

export function useGlobalShortcuts() {
  const { tabs, activeTabId } = useActiveTab();
  const { activeThreadId } = useActiveThread();
  const { toggleSidebar } = useSidebar();

  // Close current tab handler
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

  // Close other tabs handler
  const handleCloseOtherTabs = useCallback(async () => {
    if (!activeTabId || tabs.length <= 1) return;

    try {
      // Get all other tab IDs
      const otherTabIds = tabs
        .filter((tab) => tab.id !== activeTabId)
        .map((tab) => tab.id);

      // Delete all other tabs
      await Promise.all(
        otherTabIds.map((tabId) => tabService.deleteTab(tabId)),
      );

      // Emit events for each closed tab
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

  // Delete current thread handler
  const handleDeleteCurrentThread = useCallback(async () => {
    if (!activeThreadId) return;

    try {
      await threadService.deleteThread(activeThreadId);
      emitter.emit(EventNames.THREAD_DELETE, { threadId: activeThreadId });
    } catch (error) {
      logger.error("Error deleting current thread", { error });
    }
  }, [activeThreadId]);

  // Open settings handler
  const handleOpenSettings = useCallback(async () => {
    try {
      // Check if settings tab already exists
      const existingSettingTab = tabs.find((tab) => tab.type === "setting");
      logger.debug("existing tab", { existingSettingTab });

      if (existingSettingTab) {
        await tabService.activateTab(existingSettingTab.id);
      } else {
        // Create new settings tab
        const newTab = await tabService.insertTab({
          type: "setting",
          title: "Settings",
          threadId: "",
          path: "/settings/general-settings",
        });

        await tabService.activateTab(newTab.id);
      }
    } catch (error) {
      logger.error("Error opening settings", { error });
    }
  }, [tabs]);

  // Toggle sidebar handler
  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  // Register all shortcuts
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
