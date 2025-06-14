import { ProviderWapper } from "./provider";
import { ProviderModel } from "./provider-model";

export function ModelSettings() {
  return (
    <div className="flex h-full flex-col">
      <ProviderWapper />

      <ProviderModel />
    </div>
  );
}
