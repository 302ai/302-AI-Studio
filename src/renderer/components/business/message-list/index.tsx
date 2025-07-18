import { useToolBar } from "@renderer/hooks/use-tool-bar";
import type { Message } from "@shared/triplit/types";
import { motion } from "motion/react";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const { handleRefreshMessage } = useToolBar();

  if (messages.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto flex w-full max-w-[720px] flex-col gap-y-[22px]"
    >
      {messages.map((message: Message) => (
        <div key={message.id}>
          {message.role === "user" ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage
              message={message}
              handleRefreshMessage={handleRefreshMessage}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}
