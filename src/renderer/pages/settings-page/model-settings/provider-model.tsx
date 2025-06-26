import { ModelList } from "@renderer/components/business/model-list";

export function ProviderModel() {
  return (
    <div className="flex h-1/2 flex-col gap-2">
      <div className="flex h-full flex-col gap-2">
        <ModelList />
      </div>
    </div>
  );
}
