import { parseAndUpdateAttachments } from "@renderer/utils/parse-file";
import logger from "@shared/logger/renderer-logger";
import type { Message } from "@shared/triplit/types";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useActiveThread } from "./use-active-thread";

const { chatService, providerService } = window.service;
const { ipcRenderer } = window.electron;

enum IpcRendererEvent {
  CHAT_STREAM_STATUS_UPDATE = "chat:stream-status-update",
  MESSAGE_ACTIONS = "message:actions",
}

export function useChat(scrollRef?: React.RefObject<HTMLDivElement | null>) {
  const { activeThreadId } = useActiveThread();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef?.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;

    setIsAutoScroll(isAtBottom);
  }, [scrollRef]);

  const handleAutoScroll = useCallback(() => {
    if (streaming && isAutoScroll) {
      setShouldScrollToBottom(true);
    }
  }, [streaming, isAutoScroll]);

  const fetchMessages = useCallback(
    async (threadId: string): Promise<Message[]> => {
      try {
        const messages = await chatService.getMessagesByThreadId(threadId);
        setMessages(messages);
        return messages;
      } catch (err) {
        logger.error("Failed to get messages", { err });
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

        handleAutoScroll();

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
        logger.error("Failed to get messages", { err });
      }
    },
    [activeThreadId, fetchMessages, handleAutoScroll],
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
          if (!data.actions.message) return;

          setMessages((prevMessages) =>
            prevMessages.map((message) =>
              message.id === data.actions.message?.id
                ? data.actions.message
                : message,
            ),
          );
          break;

        case "delete":
          setMessages([]);
          break;

        case "delete-single":
          if (!data.actions.message) return;
          // Delete specific message
          setMessages((prevMessages) =>
            prevMessages.filter(
              (message) => message.id !== data.actions.message?.id,
            ),
          );
          break;

        case "delete-multiple": {
          if (!data.actions.messages) return;

          // Delete multiple messages
          const messageIdsToDelete = new Set(
            data.actions.messages.map((msg) => msg.id),
          );
          setMessages((prevMessages) =>
            prevMessages.filter(
              (message) => !messageIdsToDelete.has(message.id),
            ),
          );

          break;
        }

        default: {
          fetchMessages(data.threadId);
          break;
        }
      }
    },
    [fetchMessages, activeThreadId],
  );

  const stopStreamChat = useCallback(async () => {
    if (!activeThreadId) return;
    try {
      await providerService.stopStreamChat({
        threadId: activeThreadId,
      });
    } catch (err) {
      logger.error("Failed to stop stream chat", { err });
    } finally {
      // Defensive: ensure streaming state is reset even if server call fails
      // This prevents the UI from getting stuck with the stop button visible
      setStreaming(false);
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
    if (!activeThreadId) return;
    setMessages([]);

    fetchMessages(activeThreadId).then((messages) => {
      setMessages(messages);
      setShouldScrollToBottom(true);
      setStreaming(messages.at(-1)?.status === "pending");
    });
  }, [activeThreadId, fetchMessages]);

  useLayoutEffect(() => {
    if (shouldScrollToBottom && scrollRef?.current) {
      const el = scrollRef?.current;
      el.scrollTop = el.scrollHeight;
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom, scrollRef?.current]);

  return {
    activeThreadId,
    messages,
    streaming,
    handleScroll,
    stopStreamChat,
  };
}
