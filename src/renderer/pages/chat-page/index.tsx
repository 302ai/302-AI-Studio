import { ChatInput } from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";

export function ChatPage() {
  return (
    <div className="flex size-full flex-col">
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      <div className="flex-shrink-0 border-border/40 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput />
      </div>
    </div>
  );
}
