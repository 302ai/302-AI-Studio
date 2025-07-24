import { ArtifactPreviewPanel } from "@renderer/components/business/artifacts/artifact-preview-panel";
import {
  ChatInput,
  type ChatInputRef,
} from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";
import { Button } from "@renderer/components/ui/button";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { useArtifact } from "@renderer/hooks/use-artifact";
import { useChat } from "@renderer/hooks/use-chat";
import { useChatInputFocus } from "@renderer/hooks/use-chat-input-focus";
import { useTriplit } from "@renderer/hooks/use-triplit";
import { cn } from "@renderer/lib/utils";
import { motion } from "motion/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { NewThread } from "./new-thread";

export function ChatPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const { isTransitioning } = useSidebar();

  const { t } = useTranslation();
  const { activeThreadId, messages, streaming, stopStreamChat, handleScroll } =
    useChat(scrollRef);
  const { isArtifactOpen } = useArtifact();
  const { settings } = useTriplit();
  useChatInputFocus(chatInputRef);

  const isWelcomeState = !activeThreadId;

  if (isWelcomeState) {
    return <NewThread />;
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full",
        isArtifactOpen ? "" : "flex-1",
      )}
    >
      <div
        className={cn(
          "flex h-full flex-col py-6 transition-all duration-300 ease-in-out",
          isArtifactOpen ? "flex-[0_0_60%]" : "flex-1",
        )}
      >
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto"
          onScroll={handleScroll}
          style={{
            scrollbarGutter: "stable",
          }}
        >
          {settings && <MessageList messages={messages} settings={settings} />}
        </div>

        <motion.div
          layoutId={isTransitioning ? undefined : "chat-input"}
          transition={{
            duration: isTransitioning ? 0 : 0.3,
            ease: "easeInOut",
          }}
          className="relative mx-auto w-full max-w-[720px] pt-4"
        >
          <ChatInput ref={chatInputRef} streaming={streaming} />
          <Button
            className={cn(
              "-top-[-5px] -translate-x-1/2 -translate-y-full absolute left-1/2 z-10",
              {
                hidden: !streaming,
              },
            )}
            intent="secondary"
            size="sm"
            onClick={stopStreamChat}
          >
            {t("stop-generating")}
          </Button>
        </motion.div>
      </div>

      <ArtifactPreviewPanel />
    </div>
  );
}
