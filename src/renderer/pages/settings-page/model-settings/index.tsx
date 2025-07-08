import { ProviderWapper } from "./provider";
import { ProviderModel } from "./provider-model";

export function ModelSettings() {
  return (
    <div className="flex h-screen bg-bg">
      <div className="border-border border-r-2">
        <ProviderWapper />
      </div>

      <ProviderModel />
    </div>
  );
}
