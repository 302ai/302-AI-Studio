import { DEFAULT_PROVIDERS } from "@renderer/config/providers";
import { useModelSettingStore } from "@renderer/store/settings-store/model-setting-store";
import type { ModelProvider } from "../types/providers";

const { providerService } = window.service;

export function useAddProvider() {
  const { modelProviders: modelProvider } = useModelSettingStore();

  // * Show providers that are NOT already in the modelProvider array
  const canSelectProviders = DEFAULT_PROVIDERS.filter(
    (initialProvider) =>
      !modelProvider.some(
        (existingProvider) => existingProvider.id === initialProvider.id
      )
  );
  const handleCheckKey = async (
    providerConfig: ModelProvider
  ): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> => {
    const res = await providerService.checkApiKey({
      condition: "add",
      providerCfg: providerConfig,
    });
    console.log("res", res);
    return res;
  };

  return {
    canSelectProviders,
    handleCheckKey,
  };
}
