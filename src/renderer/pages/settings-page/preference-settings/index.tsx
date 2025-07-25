import { ChatSettings } from "./chat-settings";
import { DisplayAppStore } from "./display-app-store";
import ModelSelect from "./model-select";
import { SearchService } from "./search-service";
import { StreamOutput } from "./stream-output";
import TitleModelSelect from "./title-model-select";

export function PreferenceSettings() {
  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto px-4 py-[18px]">
      <div className="mx-auto flex flex-col gap-4">
        <ChatSettings />

        <SearchService />

        <StreamOutput />

        <DisplayAppStore />

        <ModelSelect />

        <TitleModelSelect />
      </div>
    </div>
  );
}
