import logo from "@renderer/assets/llm-icons/logo.png?url";
import { ChatInput } from "@renderer/components/business/chat-input";

export function NewThread() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      <div className="flex flex-row items-center justify-center gap-4">
        <img src={logo} alt="logo" className="size-11" />
        <span className="text-4xl">Hello</span>
      </div>

      <ChatInput />
    </div>
  );
}
