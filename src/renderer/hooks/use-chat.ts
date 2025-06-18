import type { Message } from "@shared/triplit/types";
import { useCallback, useEffect, useState } from "react";
import { useActiveTab } from "./use-active-tab";
import { useActiveThread } from "./use-active-thread";

const { chatService, providerService } = window.service;
const { ipcRenderer } = window.electron;

enum IpcRendererEvent {
  CHAT_STREAM_STATUS_UPDATE = "chat:stream-status-update",
  MESSAGE_ACTIONS = "message:actions",
}

export function useChat() {
  const { activeThreadId } = useActiveThread();
  const { activeTabId } = useActiveTab();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);

  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const messages = await chatService.getMessagesByThreadId(threadId);
      setMessages(messages);
    } catch (err) {
      console.error("Failed to get messages: ", err);
    }
  }, []);

  const handleStreamStatusUpdate = useCallback(
    async (
      _event: Electron.IpcRendererEvent,
      data: {
        threadId: string;
        status: "pending" | "success" | "error" | "stop";
        delta?: string;
      },
    ) => {
      try {
        if (data.threadId !== activeThreadId) return;

        switch (data.status) {
          case "pending": {
            if (data.delta) {
              setMessages((prevMessages) =>
                prevMessages.reduce((acc, message, index) => {
                  if (
                    index === prevMessages.length - 1 &&
                    message.role === "assistant"
                  )
                    acc.push({
                      ...message,
                      content: message.content + data.delta,
                    });
                  else acc.push(message);

                  return acc;
                }, [] as Message[]),
              );
            } else {
              await fetchMessages(data.threadId);
              setStreaming(true);
            }

            break;
          }
          case "success":
          case "error":
          case "stop": {
            await fetchMessages(data.threadId);
            setStreaming(false);
            break;
          }
          default: {
            await fetchMessages(data.threadId);
            setStreaming(false);
            break;
          }
        }
      } catch (err) {
        console.error("Failed to get messages: ", err);
      }
    },
    [activeThreadId, fetchMessages],
  );

  const handleMessageActions = useCallback(
    async (
      _event: Electron.IpcRendererEvent,
      data: {
        threadId: string;
        actions: {
          type: "edit" | "delete";
          message?: Message;
        };
      },
    ) => {
      if (data.threadId !== activeThreadId) return;

      switch (data.actions.type) {
        case "edit":
          if (data.actions.message) {
            setMessages((prevMessages) =>
              prevMessages.map((message) =>
                message.id === data.actions.message?.id
                  ? data.actions.message
                  : message,
              ),
            );
          }
          break;

        case "delete":
          setMessages([]);
          break;

        default: {
          fetchMessages(data.threadId);
          break;
        }
      }
    },
    [fetchMessages, activeThreadId],
  );

  const stopStreamChat = useCallback(async () => {
    if (!activeTabId) {
      return;
    }
    try {
      await providerService.stopStreamChat({
        tabId: activeTabId,
      });
    } catch (err) {
      console.error("Failed to stop stream chat: ", err);
    }
  }, [activeTabId]);

  useEffect(() => {
    ipcRenderer.on(
      `${IpcRendererEvent.CHAT_STREAM_STATUS_UPDATE}-${activeThreadId}`,
      handleStreamStatusUpdate,
    );
    ipcRenderer.on(
      `${IpcRendererEvent.MESSAGE_ACTIONS}-${activeThreadId}`,
      handleMessageActions,
    );

    return () => {
      ipcRenderer.removeAllListeners(
        `${IpcRendererEvent.CHAT_STREAM_STATUS_UPDATE}-${activeThreadId}`,
      );
      ipcRenderer.removeAllListeners(
        `${IpcRendererEvent.MESSAGE_ACTIONS}-${activeThreadId}`,
      );
    };
  }, [handleStreamStatusUpdate, handleMessageActions, activeThreadId]);

  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
    }
  }, [activeThreadId, fetchMessages]);

  return {
    messages,
    streaming,

    stopStreamChat,
  };
}
