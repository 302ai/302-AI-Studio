import { ChatSettings } from "./chat-settings";
import { DisplayAppStore } from "./display-app-store";
import { SearchService } from "./search-service";
import { StreamOutput } from "./stream-output";

export function PreferenceSettings() {
  return (
    <div className="mx-auto flex h-full flex-col gap-4 px-4 pt-[18px]">
      <SearchService />

      <StreamOutput />

      <DisplayAppStore />

      <ChatSettings />
    </div>
  );
}
