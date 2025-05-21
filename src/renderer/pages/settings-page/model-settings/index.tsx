import { ModelList } from "./model-list";
import { ModelProvider } from "./model-provider";

export function ModelSettings() {
  return (
    <div className="flex h-full flex-col">
      <ModelProvider />
      <ModelList />
    </div>
  );
}
