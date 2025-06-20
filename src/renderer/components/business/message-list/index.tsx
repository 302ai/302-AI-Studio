import { useToolBar } from "@renderer/hooks/use-tool-bar";
import type { Message } from "@shared/triplit/types";
import { useRef } from "react";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const { handleRefreshMessage } = useToolBar();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto w-full max-w-7xl">
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
      <div ref={messagesEndRef} className="h-1" />
    </div>
  );
}
