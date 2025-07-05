import { ArtifactPreviewPanel } from "@renderer/components/business/artifacts/artifact-preview-panel";
import { ChatInput } from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";
import { Button } from "@renderer/components/ui/button";
import { useArtifact } from "@renderer/hooks/use-artifact";
import { useChat } from "@renderer/hooks/use-chat";
import { motion } from "motion/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { NewThread } from "./new-thread";

export function ChatPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { t } = useTranslation();
  const { activeThreadId, messages, streaming, stopStreamChat, handleScroll } =
    useChat(scrollRef);
  const { isArtifactOpen } = useArtifact();

  const isWelcomeState = !activeThreadId;

  if (isWelcomeState) {
    return <NewThread />;
  }

  return (
    <div
      className={`relative flex h-full w-full ${isArtifactOpen ? "" : "flex-1"}`}
    >
      <div
        className={`flex h-full flex-col p-6 pr-0 transition-all duration-300 ease-in-out ${
          isArtifactOpen ? "flex-[0_0_60%]" : "flex-1"
        }`}
      >
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto pr-6"
          onScroll={handleScroll}
          style={{
            scrollbarGutter: "stable",
          }}
        >
          <MessageList messages={messages} />
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

      <ArtifactPreviewPanel />
    </div>
  );
}
