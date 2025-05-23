import { DEFAULT_PROVIDERS } from "@renderer/config/providers";
import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";
import type { ModelProvider } from "../types/providers";

export function useAddProvider() {
  const { modelProvider } = useModelSettingStore();

  // * Show providers that are NOT already in the modelProvider array
  const canSelectProviders = DEFAULT_PROVIDERS.filter(
    (initialProvider) =>
      !modelProvider.some(
        (existingProvider) => existingProvider.id === initialProvider.id
      )
  );
  const handleCheckKey = (providerConfig: ModelProvider) => {
    console.log("providerConfig", providerConfig);
  };

  return {
    canSelectProviders,
    handleCheckKey,
  };
}
