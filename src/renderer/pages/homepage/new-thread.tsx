import { ChatInput } from "@renderer/components/business/chat-input";
import logo from "@renderer/assets/images/logo.png";

export function NewThread() {
  return (
    <>
      <div className="flex flex-row items-center justify-center gap-4">
        <img src={logo} alt="logo" className="size-11" />
        <span className="text-4xl">Hello</span>
      </div>

      <ChatInput />
    </>
  );
}
