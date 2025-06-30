import { parseAndUpdateAttachments } from "@renderer/utils/parse-file";
import type { Message } from "@shared/triplit/types";
import { useCallback, useEffect, useState } from "react";
import { useActiveThread } from "./use-active-thread";

const { chatService, providerService } = window.service;
const { ipcRenderer } = window.electron;

enum IpcRendererEvent {
  CHAT_STREAM_STATUS_UPDATE = "chat:stream-status-update",
  MESSAGE_ACTIONS = "message:actions",
}

export function useChat() {
  const { activeThreadId } = useActiveThread();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  const fetchMessages = useCallback(
    async (threadId: string): Promise<Message[]> => {
      try {
        const messages = await chatService.getMessagesByThreadId(threadId);
        setMessages(messages);
        return messages;
      } catch (err) {
        console.error("Failed to get messages: ", err);
      }

      return [];
    },
    [],
  );

  const handleStreamStatusUpdate = useCallback(
    async (
      _event: Electron.IpcRendererEvent,
      data: {
        threadId: string;
        status: "pending" | "success" | "error" | "stop";
        delta?: string;
        userMessageId?: string;
      },
    ) => {
      try {
        if (data.threadId !== activeThreadId) return;

        switch (data.status) {
          case "pending": {
            setStreaming(true);
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
            }

            break;
          }
          case "success":
          case "error":
          case "stop": {
            setStreaming(false);
            if (data.userMessageId) {
              parseAndUpdateAttachments(data.userMessageId);
            }
            await fetchMessages(data.threadId);

            break;
          }
          default: {
            setStreaming(false);
            await fetchMessages(data.threadId);
            break;
          }
        }
      } catch (err) {
        setStreaming(false);
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
          type: "edit" | "delete" | "delete-single" | "delete-multiple";
          message?: Message;
          messages?: Message[];
        };
      },
    ) => {
      if (data.threadId !== activeThreadId) return;

      switch (data.actions.type) {
        case "edit":
          if (data.actions.message) {
            setIsEditingMessage(true);
            setMessages((prevMessages) =>
              prevMessages.map((message) =>
                message.id === data.actions.message?.id
                  ? data.actions.message
                  : message,
              ),
            );
            // 延迟后重置编辑状态
            setTimeout(() => {
              setIsEditingMessage(false);
            }, 500);
          }
          break;

        case "delete":
          setMessages([]);
          break;

        case "delete-single":
          if (data.actions.message) {
            // Delete specific message
            setMessages((prevMessages) =>
              prevMessages.filter(
                (message) => message.id !== data.actions.message?.id,
              ),
            );
          }
          break;

        case "delete-multiple":
          if (data.actions.messages) {
            // Delete multiple messages
            const messageIdsToDelete = new Set(
              data.actions.messages.map((msg) => msg.id),
            );
            setMessages((prevMessages) =>
              prevMessages.filter(
                (message) => !messageIdsToDelete.has(message.id),
              ),
            );
          }
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
    if (!activeThreadId) {
      return;
    }
    try {
      await providerService.stopStreamChat({
        threadId: activeThreadId,
      });
    } catch (err) {
      console.error("Failed to stop stream chat: ", err);
    }
  }, [activeThreadId]);

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
      fetchMessages(activeThreadId).then((messages) => {
        const newMessages = messages;
        setMessages(newMessages);
        setStreaming(newMessages.at(-1)?.status === "pending");
      });
    }
  }, [activeThreadId, fetchMessages]);

  return {
    messages,
    streaming,
    isEditingMessage,

    stopStreamChat,
  };
}
