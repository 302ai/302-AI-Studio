import { ChatInput } from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";
import { Button } from "@renderer/components/ui/button";
import { useActiveThread } from "@renderer/hooks/use-active-thread";
import { useChat } from "@renderer/hooks/use-chat";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function ChatPage() {
  const { t } = useTranslation();
  const { activeThreadId } = useActiveThread();
  const { messages, streaming, stopStreamChat } = useChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (messages.length > 0) {
      const rafId = requestAnimationFrame(() => {
        if (shouldAutoScroll()) {
          scrollToBottom(streaming);
        }
      });

      return () => cancelAnimationFrame(rafId);
    }

    return undefined;
  }, [messages, streaming, shouldAutoScroll, scrollToBottom]);

  useEffect(() => {
    if (activeThreadId && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    }
  }, [activeThreadId, messages, scrollToBottom]);

  return (
    <div className="flex h-full flex-1 flex-col p-6 pr-0">
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto pr-6"
      >
        <MessageList messages={messages} />
      </div>

      {streaming && (
        <div className="flex justify-center py-2 pr-6">
          <Button
            intent="outline"
            size="small"
            className="shrink-0"
            onClick={stopStreamChat}
          >
            {t("stop-generating")}
          </Button>
        </div>
      )}

      <div className="flex-shrink-0 pt-4 pr-6">
        <ChatInput />
      </div>
    </div>
  );
}
