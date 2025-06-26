import { ProviderList } from "@renderer/components/business/provider-list";

export function ProviderWapper() {
  return (
    <div className="flex h-1/2 flex-col">
      <div className="flex h-full flex-col gap-2">
        <ProviderList />
      </div>
    </div>
  );
}
