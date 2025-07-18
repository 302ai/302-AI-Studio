import { ProviderWapper } from "./provider";
import { ProviderModel } from "./provider-model";

export function ModelSettings() {
  return (
    <div className="flex h-full w-full">
      <div className="border-border border-r-1">
        <ProviderWapper />
      </div>

      <ProviderModel />
    </div>
  );
}
