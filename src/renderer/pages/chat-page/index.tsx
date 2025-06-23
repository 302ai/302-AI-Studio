import { ChatInput } from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";
import { Button } from "@renderer/components/ui/button";
import { useActiveThread } from "@renderer/hooks/use-active-thread";
import { useChat } from "@renderer/hooks/use-chat";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function ChatPage() {
  const { t } = useTranslation();
  const { activeThreadId } = useActiveThread();
  const { messages, streaming, isEditingMessage, stopStreamChat } = useChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isEditingMessageRef = useRef(isEditingMessage);
  const isInitialLoadRef = useRef(true);

  // 保持 ref 与最新值同步
  useEffect(() => {
    isEditingMessageRef.current = isEditingMessage;
  }, [isEditingMessage]);

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
    return scrollHeight - scrollTop - clientHeight < 200;
  }, []);

  // 首次加载时直接设置滚动位置，避免闪动
  useLayoutEffect(() => {
    if (
      isInitialLoadRef.current &&
      messages.length > 0 &&
      scrollContainerRef.current
    ) {
      // 使用 setTimeout 确保在下一个事件循环中执行
      const timeoutId = setTimeout(() => {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
          isInitialLoadRef.current = false;
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  });

  useEffect(() => {
    if (messages.length > 0 && !isInitialLoadRef.current) {
      const rafId = requestAnimationFrame(() => {
        if (!isEditingMessageRef.current && shouldAutoScroll()) {
          // 非首次加载，根据是否在流输出决定是否使用动画
          scrollToBottom(!streaming);
        }
      });

      return () => cancelAnimationFrame(rafId);
    }

    return undefined;
  }, [messages, streaming, shouldAutoScroll, scrollToBottom]);

  useEffect(() => {
    if (activeThreadId && messages.length > 0) {
      setTimeout(() => {
        if (!isEditingMessageRef.current) {
          // 切换线程时直接跳转到底部
          scrollToBottom(true);
        }
      }, 100);
    }
  }, [activeThreadId, messages, scrollToBottom]);

  return (
    <div className="flex h-full flex-1 flex-col p-6 pr-0">
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto pr-6"
        style={{
          scrollbarGutter: "stable",
        }}
      >
        {messages.length > 0 && <MessageList messages={messages} />}
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
