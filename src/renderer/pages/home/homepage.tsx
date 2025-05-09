import { useEffect } from "react";
import logo from "@renderer/assets/images/logo.png";
import { ChatInput } from "@renderer/components/business/chat-input";

// The "api" comes from the context bridge in preload/index.ts
const { api } = window;

export function HomePage() {
  useEffect(() => {
    // check the console on dev tools
    api.sayHelloFromBridge();
  }, []);

  return (
    <div className="flex size-full flex-col items-center justify-center gap-9">
      <div className="flex flex-row items-center justify-center gap-4">
        <img src={logo} alt="logo" className="size-11" />
        <span className="text-4xl">Hello</span>
      </div>

      <ChatInput />
    </div>
  );
}
