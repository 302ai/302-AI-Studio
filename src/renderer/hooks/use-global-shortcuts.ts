import { useSidebar } from "@renderer/components/ui/sidebar";
import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import { useCallback } from "react";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";
import { useGlobalShortcutHandler } from "./use-global-shortcut-handler";
import { useTabBar } from "./use-tab-bar";

const { tabService, threadService, uiService, messageService } = window.service;

export function useShortcutsHandlers() {
  const { tabs, activeTabId } = useActiveTab();
  const { activeThreadId } = useActiveThread();
  const { toggleSidebar } = useSidebar();
  const { handleAddNewTab } = useTabBar();

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
        handleAddNewTab("setting");
      }
    } catch (error) {
      logger.error("Error opening settings", { error });
    }
  }, [tabs, handleAddNewTab]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleCleanMessages = useCallback(async () => {
    if (!activeThreadId) return;
    try {
      await messageService.deleteMessagesByThreadId(activeThreadId);
    } catch (error) {
      logger.error("Error clearing messages", { error });
    }
  }, [activeThreadId]);

  // Register global shortcut handlers
  useGlobalShortcutHandler("close-current-tab", handleCloseCurrentTab);
  useGlobalShortcutHandler("close-other-tabs", handleCloseOtherTabs);
  useGlobalShortcutHandler("delete-current-thread", handleDeleteCurrentThread);
  useGlobalShortcutHandler("open-settings", handleOpenSettings);
  useGlobalShortcutHandler("toggle-sidebar", handleToggleSidebar);
  useGlobalShortcutHandler("new-chat", () => handleAddNewTab("thread"));
  useGlobalShortcutHandler("clear-messages", handleCleanMessages);

  return {
    handleCloseCurrentTab,
    handleCloseOtherTabs,
    handleDeleteCurrentThread,
    handleOpenSettings,
    handleToggleSidebar,
    handleCleanMessages,
  };
}
