import type { DropResult } from "@hello-pangea/dnd";
import { triplitClient } from "@renderer/client";
import logger from "@shared/logger/renderer-logger";
import type { Tab, TabType } from "@shared/triplit/types";
import { useQuery, useQueryOne } from "@triplit/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { EventNames, emitter } from "../services/event-service";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";
import { usePrivacyMode } from "./use-privacy-mode";

const { tabService } = window.service;

export function useTabBar() {
  const { t } = useTranslation();
  const { activeTabId, activeTab, setActiveTabId } = useActiveTab();
  const { setActiveThreadId } = useActiveThread();
  const { privacyState, inheritPrivacyState } = usePrivacyMode();

  const tabsQuery = triplitClient.query("tabs").Order("order", "ASC");
  const { results: alltabs } = useQuery(triplitClient, tabsQuery);

  const settingsQuery = triplitClient.query("settings");
  const { result: settings } = useQueryOne(triplitClient, settingsQuery);

  const navigate = useNavigate();

  const [tabs, setTabs] = useState<Tab[]>([]);

  const handleAddNewTab = useCallback(
    async (type: TabType, title?: string, params?: Record<string, string>) => {
      switch (type) {
        case "thread": {
          const shouldUseDefaultPrivacy =
            privacyState.isPrivate && settings?.defaultPrivacyMode;

          if (shouldUseDefaultPrivacy) {
            await inheritPrivacyState();
          } else {
            const newTab = await tabService.insertTab({
              title: t("thread.new-thread-title"),
              type,
              path: "/",
              isPrivate: false,
            });
            const promises = [setActiveTabId(newTab.id), setActiveThreadId("")];
            await Promise.all(promises);
            logger.info("Tab created", { newTab });
          }

          break;
        }

        case "setting": {
          const existingSettingTab = tabs.find((tab) => tab.type === "setting");
          if (existingSettingTab) {
            const promises = [
              setActiveTabId(existingSettingTab.id),
              setActiveThreadId(""),
            ];
            await Promise.all(promises);
          } else {
            const newTab = await tabService.insertTab({
              title: t("settings.tab-title"),
              type,
              path: "/settings/general-settings",
              isPrivate: false,
            });
            const promises = [setActiveTabId(newTab.id), setActiveThreadId("")];
            await Promise.all(promises);
          }
          break;
        }

        case "302ai-tool": {
          const newTab = await tabService.insertTab({
            title: title ?? "",
            type,
            path: `/302ai-tool/${params?.subdomain}`,
            isPrivate: false,
          });
          const promises = [setActiveTabId(newTab.id), setActiveThreadId("")];
          await Promise.all(promises);
          break;
        }

        default:
          break;
      }

      emitter.emit(EventNames.CODE_PREVIEW_CLOSE, null);
    },
    [
      setActiveTabId,
      setActiveThreadId,
      t,
      tabs,
      inheritPrivacyState,
      privacyState.isPrivate,
      settings?.defaultPrivacyMode,
    ],
  );

  // const handleAddNewTab = async (type: TabType) => {
  //   if (type === "setting") {
  //     const existingSettingTab = tabs.find((tab) => tab.type === "setting");

  //     if (existingSettingTab) {
  //       const promises = [
  //         setActiveTabId(existingSettingTab.id),
  //         setActiveThreadId(""),
  //       ];
  //       await Promise.all(promises);

  //       emitter.emit(EventNames.CODE_PREVIEW_CLOSE, null);

  //       return;
  //     }
  //   }

  //   const shouldUseDefaultPrivacy =
  //     type === "thread" &&
  //     privacyState.isPrivate &&
  //     settings?.defaultPrivacyMode;

  //   if (shouldUseDefaultPrivacy) {
  //     await inheritPrivacyState();
  //   } else {
  //     const newTab = await tabService.insertTab({
  //       title:
  //         type === "thread"
  //           ? t("thread.new-thread-title")
  //           : t("settings.tab-title"),
  //       type,
  //       path: type === "thread" ? "/" : "/settings/general-settings",
  //       isPrivate: false,
  //     });
  //     const promises = [setActiveTabId(newTab.id), setActiveThreadId("")];
  //     await Promise.all(promises);
  //     logger.info("Tab created", { newTab });
  //   }

  //   emitter.emit(EventNames.CODE_PREVIEW_CLOSE, null);
  // };

  const activateTabId = async (id: string) => {
    try {
      setActiveTabId(id);
      emitter.emit(EventNames.TAB_SELECT, { tabId: id });
    } catch (error) {
      logger.error("Failed to activate tab", { error });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    if (result.source.index === result.destination.index) {
      return;
    }

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    const newTabs = [...tabs];
    const [movedTab] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, movedTab);
    setTabs(newTabs);

    try {
      await tabService.moveTab(fromIndex, toIndex, tabs);
      logger.debug("Tab order updated successfully");
    } catch (error) {
      logger.error("Failed to move tab:", { error });
      setTabs(tabs);
    }
  };

  useEffect(() => {
    setTabs(alltabs || []);
  }, [alltabs]);

  /**
   * * This effect is used to navigate to the home page if the tabs are empty
   */
  useEffect(() => {
    if (tabs.length === 0) {
      navigate("/");
    }
  }, [tabs, navigate]);

  /**
   * * This effect is used to navigate to the active tab
   */
  useEffect(() => {
    if (activeTab) {
      navigate(activeTab?.path || "/");
    }
  }, [activeTab, navigate]);

  return {
    tabs,
    activeTabId,
    activateTabId,
    setActiveTabId,
    handleAddNewTab,
    handleDragEnd,
  };
}
