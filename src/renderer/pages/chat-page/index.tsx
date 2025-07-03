import { ArtifactPreviewPanel } from "@renderer/components/business/artifacts/artifact-preview-panel";
import { ChatInput } from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";
import { Button } from "@renderer/components/ui/button";
import { useActiveThread } from "@renderer/hooks/use-active-thread";
import { useChat } from "@renderer/hooks/use-chat";
import { EventNames, emitter } from "@renderer/services/event-service";
import { motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { NewThread } from "./new-thread";

export function ChatPage() {
  const { t } = useTranslation();
  const { activeThreadId } = useActiveThread();
  const { messages, streaming, isEditingMessage, stopStreamChat } = useChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isEditingMessageRef = useRef(isEditingMessage);
  const isInitialLoadRef = useRef(true);

  const isWelcomeState = !activeThreadId;

  // 监听预览面板状态变化以调整布局
  const [isCodePreviewOpen, setIsCodePreviewOpen] = useState(false);

  useEffect(() => {
    isEditingMessageRef.current = isEditingMessage;
  }, [isEditingMessage]);

  // 监听预览面板状态变化
  useEffect(() => {
    const unsubscribeOpen = emitter.on(EventNames.CODE_PREVIEW_OPEN, () => {
      setIsCodePreviewOpen(true);
    });

    const unsubscribeClose = emitter.on(EventNames.CODE_PREVIEW_CLOSE, () => {
      setIsCodePreviewOpen(false);
    });

    return () => {
      unsubscribeOpen();
      unsubscribeClose();
    };
  }, []);

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

  useLayoutEffect(() => {
    if (
      isInitialLoadRef.current &&
      messages.length > 0 &&
      scrollContainerRef.current
    ) {
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
          scrollToBottom(true);
        }
      }, 100);
    }
  }, [activeThreadId, messages, scrollToBottom]);

  if (isWelcomeState) {
    return <NewThread />;
  }

  return (
    <motion.div
      key="chat-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative flex h-full w-full ${isCodePreviewOpen ? "" : "flex-1"}`}
    >
      {/* 主聊天区域 */}
      <div
        className={`flex h-full flex-col p-6 pr-0 transition-all duration-300 ease-in-out ${
          isCodePreviewOpen ? "flex-[0_0_60%]" : "flex-1"
        }`}
      >
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-2 pr-6"
          >
            <Button
              intent="outline"
              size="small"
              className="shrink-0"
              onClick={stopStreamChat}
            >
              {t("stop-generating")}
            </Button>
          </motion.div>
        )}
        <motion.div
          layoutId="chat-input"
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="flex-shrink-0 pt-4 pr-6"
        >
          <ChatInput />
        </motion.div>
      </div>

      {/* Artifact 预览 */}
      <ArtifactPreviewPanel />
    </motion.div>
  );
}
