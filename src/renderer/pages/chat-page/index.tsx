import { ChatInput } from "@renderer/components/business/chat-input";
import { MessageList } from "@renderer/components/business/message-list";

export function ChatPage() {
  return (
    <div className="flex size-full flex-col p-6 pr-0">
      <div className="flex-1 overflow-y-auto pr-6">
        <MessageList />
      </div>

      <div className="flex-shrink-0 pt-4">
        <ChatInput />
      </div>
    </div>
  );
}
