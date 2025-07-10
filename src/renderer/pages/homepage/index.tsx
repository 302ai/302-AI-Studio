import { ChatPage } from "../chat-page";
import { HomePageTitleBar } from "./title-bar";

export function HomePage() {
  return (
    <div className="relative flex h-full flex-1 flex-col">
      <HomePageTitleBar />
      <ChatPage />
    </div>
  );
}
