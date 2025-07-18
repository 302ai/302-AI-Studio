import { useSidebar } from "@renderer/components/ui/sidebar";
import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";
import { useAttachments } from "./use-attachments";
import { useChat } from "./use-chat";
import { useGlobalShortcutHandler } from "./use-global-shortcut-handler";
import { useMessageActions } from "./use-message-actions";
import { usePrivacyMode } from "./use-privacy-mode";
import { useTabBar } from "./use-tab-bar";
import { useTabInput } from "./use-tab-input";
import { useToolBar } from "./use-tool-bar";

const { tabService, threadService, uiService, messageService } = window.service;

export function useShortcutsHandlers() {
  const { tabs, activeTabId } = useActiveTab();
  const { activeThreadId } = useActiveThread();
  const { toggleSidebar } = useSidebar();
  const { handleAddNewTab } = useTabBar();
  const { t } = useTranslation("translation", { keyPrefix: "shortcuts" });
  const { stopStreamChat, messages } = useChat();
  const { getInputByTabId } = useTabInput();
  const {
    handleRefreshMessage,
    selectedModelId,
    handleSendMessage: sendMessage,
  } = useToolBar();
  const { handleCreateNewBranch } = useMessageActions();
  const { getAttachmentsByTabId } = useAttachments();
  const { togglePrivacyMode, privacyState } = usePrivacyMode();

  const handleRefreshLatestMessage = useCallback(async () => {
    if (!activeThreadId) return;
    const latestMessage = messages.findLast(
      (message) => message.role === "assistant",
    );
    if (!latestMessage) return;
    await handleRefreshMessage(latestMessage.id);
  }, [activeThreadId, messages, handleRefreshMessage]);

  const handleCreateNewBranchForLatestMessage = useCallback(async () => {
    if (!activeThreadId) return;
    const latestMessage = messages.findLast(
      (message) => message.role === "assistant",
    );
    if (!latestMessage) return;
    await handleCreateNewBranch(latestMessage, latestMessage.providerId);
  }, [activeThreadId, messages, handleCreateNewBranch]);

  const handleCreateNewBranchForLatestMessageWithInputAndAttachments =
    useCallback(async () => {
      if (!activeThreadId || !activeTabId) return;
      const latestMessage = messages.findLast(
        (message) => message.role === "assistant",
      );
      if (!latestMessage) return;
      if (!selectedModelId) {
        return;
      }
      const input = await getInputByTabId(activeTabId);

      const attachments = await getAttachmentsByTabId(activeTabId);

      const newState = await handleCreateNewBranch(
        latestMessage,
        latestMessage.providerId,
      );
      if (!newState) return;
      const { tabId: newTabId, threadId: newThreadId } = newState;
      if (!newTabId) return;
      await sendMessage(input, attachments, "", newTabId, newThreadId);
    }, [
      activeThreadId,
      messages,
      handleCreateNewBranch,
      activeTabId,
      getAttachmentsByTabId,
      getInputByTabId,
      sendMessage,
      selectedModelId,
    ]);

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

  const handleNextTab = useCallback(async () => {
    if (!activeTabId || tabs.length <= 1) return;

    try {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      if (currentIndex === -1) return;

      // 计算下一个标签页的索引，如果是最后一个则回到第一个
      const nextIndex = (currentIndex + 1) % tabs.length;
      const nextTab = tabs[nextIndex];

      await tabService.activateTab(nextTab.id);
      await uiService.updateActiveTabId(nextTab.id);
    } catch (error) {
      logger.error("Error switching to next tab", { error });
    }
  }, [activeTabId, tabs]);

  const handlePreviousTab = useCallback(async () => {
    if (!activeTabId || tabs.length <= 1) return;

    try {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
      if (currentIndex === -1) return;

      // 计算上一个标签页的索引，如果是第一个则回到最后一个
      const previousIndex =
        currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      const previousTab = tabs[previousIndex];

      await tabService.activateTab(previousTab.id);
      await uiService.updateActiveTabId(previousTab.id);
    } catch (error) {
      logger.error("Error switching to previous tab", { error });
    }
  }, [activeTabId, tabs]);

  const handleSwitchToTab = useCallback(
    async (tabNumber: number) => {
      const tabIndex = tabNumber - 1; // 转换为数组索引

      if (tabIndex < 0 || tabIndex >= tabs.length) {
        // 标签页不存在，显示提示
        toast.error(t("tab-not-exist", { tabNumber }));
        return;
      }

      const targetTab = tabs[tabIndex];
      if (!targetTab) {
        toast.error(t("tab-not-exist", { tabNumber }));
        return;
      }

      try {
        await tabService.activateTab(targetTab.id);
        await uiService.updateActiveTabId(targetTab.id);
      } catch (error) {
        logger.error(`Error switching to tab ${tabNumber}`, { error });
        toast.error(t("tab-switch-error", { tabNumber }));
      }
    },
    [tabs, t],
  );

  // Register global shortcut handlers
  useGlobalShortcutHandler("close-current-tab", handleCloseCurrentTab);
  useGlobalShortcutHandler("close-other-tabs", handleCloseOtherTabs);
  useGlobalShortcutHandler("delete-current-thread", handleDeleteCurrentThread);
  useGlobalShortcutHandler("open-settings", handleOpenSettings);
  useGlobalShortcutHandler("toggle-sidebar", handleToggleSidebar);
  useGlobalShortcutHandler("new-tab", () => handleAddNewTab("thread"));
  useGlobalShortcutHandler("clear-messages", handleCleanMessages);
  useGlobalShortcutHandler("next-tab", handleNextTab);
  useGlobalShortcutHandler("previous-tab", handlePreviousTab);

  // Register tab switching shortcuts (1-9)
  useGlobalShortcutHandler("switch-to-tab-1", () => handleSwitchToTab(1));
  useGlobalShortcutHandler("switch-to-tab-2", () => handleSwitchToTab(2));
  useGlobalShortcutHandler("switch-to-tab-3", () => handleSwitchToTab(3));
  useGlobalShortcutHandler("switch-to-tab-4", () => handleSwitchToTab(4));
  useGlobalShortcutHandler("switch-to-tab-5", () => handleSwitchToTab(5));
  useGlobalShortcutHandler("switch-to-tab-6", () => handleSwitchToTab(6));
  useGlobalShortcutHandler("switch-to-tab-7", () => handleSwitchToTab(7));
  useGlobalShortcutHandler("switch-to-tab-8", () => handleSwitchToTab(8));
  useGlobalShortcutHandler("switch-to-tab-9", () => handleSwitchToTab(9));

  useGlobalShortcutHandler("stop-generation", () => stopStreamChat());

  useGlobalShortcutHandler("regenerate-response", () =>
    handleRefreshLatestMessage(),
  );

  useGlobalShortcutHandler("create-branch", () =>
    handleCreateNewBranchForLatestMessage(),
  );

  useGlobalShortcutHandler("branch-and-send", () =>
    handleCreateNewBranchForLatestMessageWithInputAndAttachments(),
  );

  useGlobalShortcutHandler("toggle-incognito-mode", () => {
    if (privacyState.canToggle) togglePrivacyMode();
  });

  return {
    handleCloseCurrentTab,
    handleCloseOtherTabs,
    handleDeleteCurrentThread,
    handleOpenSettings,
    handleToggleSidebar,
    handleCleanMessages,
    handleNextTab,
    handlePreviousTab,
    handleSwitchToTab,
  };
}
