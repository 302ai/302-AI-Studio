import logger from "@shared/logger/renderer-logger";
import debounce from "lodash-es/debounce";
import { useCallback, useEffect, useState } from "react";
import { useActiveTab } from "./use-active-tab";

const { tabService } = window.service;

export function useTabInput() {
  const [input, setInput] = useState("");
  const { activeTabId } = useActiveTab();

  // 防抖更新tab的inputValue，避免频繁写入数据库
  const debouncedUpdateTabInput = useCallback(
    debounce(async (tabId: string, inputValue: string) => {
      if (tabId) {
        try {
          await tabService.updateTab(tabId, { inputValue });
        } catch (error) {
          logger.error("Failed to update tab input value", { error });
        }
      }
    }, 500), // 500ms防抖延迟
    [],
  );

  // 处理输入变化
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      // 使用防抖更新tab的inputValue
      if (activeTabId) {
        debouncedUpdateTabInput(activeTabId, value);
      }
    },
    [activeTabId, debouncedUpdateTabInput],
  );

  const setInputByTabId = useCallback(async (tabId: string, value: string) => {
    setInput(value);
    if (tabId) {
      await tabService.updateTab(tabId, { inputValue: value });
    }
  }, []);

  const getInputByTabId = useCallback(async (tabId: string) => {
    if (tabId) {
      const tab = await tabService.getTab(tabId);
      return tab?.inputValue || "";
    }
    return "";
  }, []);

  // 清空输入
  const clearInput = useCallback(
    async (tabId?: string) => {
      const currentTabId = tabId || activeTabId;
      setInput("");
      // 取消所有待执行的防抖操作，避免清空后被重新赋值
      debouncedUpdateTabInput.cancel();
      // 清空input时也清空tab的inputValue
      if (currentTabId) {
        await tabService.updateTab(currentTabId, { inputValue: "" });
      }
    },
    [activeTabId, debouncedUpdateTabInput],
  );

  const clearInputByTabId = useCallback(async (tabId: string) => {
    setInput("");
    if (tabId) {
      await tabService.updateTab(tabId, { inputValue: "" });
    }
  }, []);

  // 当tab切换时，从数据库加载inputValue
  useEffect(() => {
    const loadTabInputValue = async () => {
      if (activeTabId) {
        try {
          const tab = await tabService.getTab(activeTabId);
          if (tab?.inputValue) {
            setInput(tab.inputValue);
          } else {
            setInput("");
          }
        } catch (error) {
          logger.error("Failed to load tab input value", { error });
        }
      }
    };

    loadTabInputValue();
  }, [activeTabId]);

  return {
    input,
    setInput,
    handleInputChange,
    clearInput,
    getInputByTabId,
    setInputByTabId,
    clearInputByTabId,
  };
}
