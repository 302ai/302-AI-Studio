import { useModelSettingStore } from "../store/settings-store/model-setting-store";
import { INITIAL_PROVIDERS } from "../config/providers";

export function useAddProvider() {
  const { modelProvider } = useModelSettingStore();

  // * Show providers that are NOT already in the modelProvider array
  const canSelectProviders = INITIAL_PROVIDERS.filter(
    (initialProvider) =>
      !modelProvider.some(
        (existingProvider) => existingProvider.id === initialProvider.id
      )
  );
  const handleCheckKey = () => {
    console.log("check key");
  };

  return {
    canSelectProviders,
    handleCheckKey,
  };
}
