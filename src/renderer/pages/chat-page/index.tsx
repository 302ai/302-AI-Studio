import { triplitClient } from "@renderer/client";
import { ChatInput } from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";
import { Button } from "@renderer/components/ui/button";
import { useActiveThread } from "@renderer/hooks/use-active-thread";
import { useStreamChat } from "@renderer/hooks/use-stream-chat";
import { useQuery } from "@triplit/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

export function ChatPage() {
  const { activeThreadId } = useActiveThread();
  const { isStreaming, mergeMessages, stopStreamChat } = useStreamChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleStopStreaming = useCallback(() => {
    stopStreamChat();
  }, [stopStreamChat]);

  const messagesQuery = useMemo(() => {
    if (!activeThreadId) return null;
    return triplitClient
      .query("messages")
      .Where("threadId", "=", activeThreadId)
      .Order("orderSeq", "ASC");
  }, [activeThreadId]);

  const { results: messages } = useQuery(
    triplitClient,
    messagesQuery ||
      triplitClient.query("messages").Where("id", "=", "non-existent"),
  );

  // Use the hook's mergeMessages method for intelligent message merging
  const messagesList = useMemo(() => {
    return mergeMessages(messages || []);
  }, [mergeMessages, messages]);

  const scrollToBottom = useCallback((instant = false) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (instant) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, []);

  const shouldAutoScroll = useCallback(() => {
    if (!scrollContainerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Simplified scroll logic with single effect
  useLayoutEffect(() => {
    if (messagesList.length > 0) {
      const rafId = requestAnimationFrame(() => {
        if (shouldAutoScroll()) {
          scrollToBottom(isStreaming);
        }
      });

      return () => cancelAnimationFrame(rafId);
    }

    return undefined;
  }, [messagesList, isStreaming, shouldAutoScroll, scrollToBottom]);

  useEffect(() => {
    if (activeThreadId && messagesList.length > 0) {
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    }
  }, [activeThreadId, messagesList.length, scrollToBottom]);

  return (
    <div className="flex h-full flex-1 flex-col p-6 pr-0">
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto pr-6"
      >
        <MessageList messages={messagesList} />
      </div>

      {isStreaming && (
        <div className="flex justify-center py-2 pr-6">
          <Button
            intent="outline"
            size="small"
            className="shrink-0"
            onClick={handleStopStreaming}
          >
            Stop Generating
          </Button>
        </div>
      )}

      <div className="flex-shrink-0 pt-4 pr-6">
        <ChatInput />
      </div>
    </div>
  );
}
