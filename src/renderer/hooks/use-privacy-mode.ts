import { triplitClient } from "@renderer/client";
import { useActiveTab } from "@renderer/hooks/use-active-tab";
import { useActiveThread } from "@renderer/hooks/use-active-thread";
import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import { useQueryOne } from "@triplit/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const { tabService, threadService, settingsService } = window.service;

export interface PrivacyModeState {
  isPrivate: boolean;
  canToggle: boolean;
}

export function usePrivacyMode() {
  const { t } = useTranslation();
  const { activeTab, setActiveTabId } = useActiveTab();
  const { selectedThread, setActiveThreadId } = useActiveThread();

  const settingsQuery = triplitClient.query("settings");
  const { result: settings } = useQueryOne(triplitClient, settingsQuery);
  const selectedModelId = settings?.selectedModelId || "";

  const providerQuery = triplitClient
    .query("models")
    .Where("enabled", "=", true)
    .Where("id", "=", selectedModelId)
    .Include("provider");
  const { result: provider } = useQueryOne(triplitClient, providerQuery);

  const [privacyState, setPrivacyState] = useState<PrivacyModeState>({
    isPrivate: false,
    canToggle: true,
  });

  const checkSessionStarted = useCallback(
    async (currentThreadId: string | undefined | null) => {
      logger.info("Checking session status", { currentThreadId });
      if (!currentThreadId) {
        logger.warn("No thread ID provided");
        return false;
      }

      try {
        const messagesQuery = triplitClient
          .query("messages")
          .Where("threadId", "=", currentThreadId);
        const messages = await triplitClient.fetch(messagesQuery);
        return messages && messages.length > 0;
      } catch (error) {
        logger.error("Failed to check session status", { error });
        return false;
      }
    },
    [],
  );

  const updatePrivacyState = useCallback(async () => {
    const isSessionStarted = await checkSessionStarted(activeTab?.threadId);
    const canToggle = !isSessionStarted;

    // Fix logic consistency: use same condition for reading as for writing
    let isPrivate = false;
    if (activeTab?.id) {
      // If there's an active tab, use its privacy state
      isPrivate = activeTab.isPrivate || false;
    } else {
      // If no active tab, use global settings
      isPrivate = settings?.isPrivate || false;
    }

    setPrivacyState({
      isPrivate,
      canToggle,
    });
  }, [checkSessionStarted, activeTab, settings?.isPrivate]);

  useEffect(() => {
    updatePrivacyState();
  }, [updatePrivacyState]);

  // Toggle privacy mode with validation
  const togglePrivacyMode = useCallback(async () => {
    if (!privacyState.canToggle) {
      return false;
    }

    try {
      const newPrivacyState = !privacyState.isPrivate;
      // Update local state immediately for consistency
      setPrivacyState((prev) => {
        return {
          ...prev,
          isPrivate: newPrivacyState,
        };
      });

      // Update active tab if exists (same logic as reading)
      if (activeTab?.id) {
        await tabService.updateTab(activeTab.id, {
          isPrivate: newPrivacyState,
        });
      } else {
        await settingsService.setEnablePrivate(newPrivacyState);
      }

      // Update active thread if exists
      if (selectedThread?.id) {
        await threadService.updateThread(selectedThread.id, {
          isPrivate: newPrivacyState,
        });
      }

      // Emit event for other components
      emitter.emit(EventNames.PRIVACY_MODE_TOGGLE, {
        isPrivate: newPrivacyState,
        tabId: activeTab?.id,
        threadId: selectedThread?.id,
      });

      toast.success(
        newPrivacyState
          ? t("privacy-mode.enabled.description")
          : t("privacy-mode.disabled.description"),
      );

      return true;
    } catch (error) {
      logger.error("Failed to toggle privacy mode", { error });
      // Rollback local state on error
      setPrivacyState((prev) => ({
        ...prev,
        isPrivate: !prev.isPrivate,
      }));
      toast.error(t("privacy-mode.error.description"));
      return false;
    }
  }, [
    privacyState.canToggle,
    privacyState.isPrivate,
    activeTab?.id,
    selectedThread?.id,
    t,
  ]);

  const confirmSwitchFromPrivate = useCallback(
    async (action: string): Promise<boolean> => {
      if (!privacyState.isPrivate) {
        return true;
      }

      return new Promise((resolve) => {
        const handleConfirm = () => {
          resolve(true);
          cleanup();
        };

        const handleCancel = () => {
          resolve(false);
          cleanup();
        };

        const cleanup = () => {
          emitter.off(EventNames.PRIVACY_MODE_CONFIRM, handleConfirm);
          emitter.off(EventNames.PRIVACY_MODE_CANCEL, handleCancel);
        };

        emitter.on(EventNames.PRIVACY_MODE_CONFIRM, handleConfirm);
        emitter.on(EventNames.PRIVACY_MODE_CANCEL, handleCancel);

        emitter.emit(EventNames.PRIVACY_MODE_CONFIRM_DIALOG, {
          action,
          message: t("privacy-mode.confirm-switch.message", { action }),
        });
      });
    },
    [privacyState.isPrivate, t],
  );

  const createPrivateSession = useCallback(async () => {
    try {
      const newThread = await threadService.insertThread({
        title: t("thread.private-thread-title"),
        providerId: provider?.id || "",
        modelId: selectedModelId || "",
        isPrivate: true,
      });

      const newTab = await tabService.insertTab({
        title: t("thread.private-thread-title"),
        type: "thread",
        isPrivate: true,
        threadId: newThread.id,
        inputValue: null,
        files: null,
        path: "/",
      });

      await setActiveTabId(newTab.id);
      await setActiveThreadId(newThread.id);

      return { thread: newThread, tab: newTab };
    } catch (error) {
      logger.error("Failed to create private session", { error });
      throw error;
    }
  }, [t, setActiveTabId, setActiveThreadId, selectedModelId, provider]);

  const inheritPrivacyState = useCallback(async () => {
    if (!privacyState.isPrivate) {
      return false;
    }

    try {
      await createPrivateSession();
      return true;
    } catch (error) {
      logger.error("Failed to inherit privacy state", { error });
      return false;
    }
  }, [privacyState.isPrivate, createPrivateSession]);

  // Cleanup private session data
  const cleanupPrivateSession = useCallback(async () => {
    if (!privacyState.isPrivate) {
      return;
    }

    try {
      if (selectedThread?.id && selectedThread.isPrivate) {
        await threadService.deleteThread(selectedThread.id);
      }

      if (activeTab?.id && activeTab.isPrivate) {
        await tabService.deleteTab(activeTab.id);
      }
    } catch (error) {
      logger.error("Failed to cleanup private session", { error });
    }
  }, [
    privacyState.isPrivate,
    selectedThread?.id,
    selectedThread?.isPrivate,
    activeTab?.id,
    activeTab?.isPrivate,
  ]);

  return {
    privacyState,
    togglePrivacyMode,
    confirmSwitchFromPrivate,
    createPrivateSession,
    inheritPrivacyState,
    cleanupPrivateSession,
  };
}
