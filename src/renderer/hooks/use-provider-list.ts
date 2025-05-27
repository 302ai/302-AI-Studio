import { useState } from "react";
import { DEFAULT_PROVIDERS } from "../config/providers";
import { useModelSettingStore } from "../store/settings-store/model-setting-store";
import type { ModelProvider } from "../types/providers";

const { configService, providerService } = window.service;

export type ModelActionType = "add" | "edit" | "delete";

export function useProviderList() {
  const {
    modelProviders,
    selectedModelProvider,
    providerModelMap,
    moveModelProvider,
    setSelectedModelProvider,
    removeModelProvider,
    addModelProvider,
    setProviderModelMap,
    updateSelectedModelProvider,
  } = useModelSettingStore();

  const [state, setState] = useState<ModelActionType | null>(null);

  // * Show providers that are NOT already in the modelProvider array
  const canSelectProviders = DEFAULT_PROVIDERS.filter(
    (initialProvider) =>
      !modelProviders.some(
        (existingProvider) => existingProvider.id === initialProvider.id
      )
  );

  const closeModal = () => {
    setState(null);
  };

  const handleDelete = () => {
    if (!selectedModelProvider) {
      closeModal();
      return;
    }

    removeModelProvider(selectedModelProvider.id);
    setSelectedModelProvider(null);
    closeModal();
  };

  const handleUpdateProvider = (updatedProvider: ModelProvider) => {
    const { name, baseUrl, apiKey, apiType } = updatedProvider;

    console.log("handleUpdateProvider", updatedProvider);

    providerService.updateProviderConfig(updatedProvider.id, {
      name,
      baseUrl,
      apiKey,
      apiType,
    });

    updateSelectedModelProvider({
      name,
      baseUrl,
      apiKey,
      apiType,
    });

    closeModal();
  };

  const handleAddProvider = async (provider: ModelProvider) => {
    const models = await configService.getProviderModels(provider.id);
    setProviderModelMap(provider.id, models);

    addModelProvider(provider);
    // * Auto-select the newly added provider to show its models
    setSelectedModelProvider(provider);

    closeModal();
  };

  const handleCheckKey = async (
    providerCfg: ModelProvider,
    condition: "add" | "edit"
  ): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> => {
    if (condition === "edit") {
      const { id, name, baseUrl, apiKey, apiType } = providerCfg;
      return await providerService.checkApiKey({
        condition,
        providerId: id,
        providerCfg: {
          name,
          baseUrl,
          apiKey,
          apiType,
        },
      });
    }

    // * Handle the condition "add"
    return await providerService.checkApiKey({
      condition,
      providerCfg,
    });
  };

  return {
    modelProviders,
    selectedModelProvider,
    state,
    canSelectProviders,
    providerModelMap,
    setState,
    closeModal,
    handleDelete,
    moveModelProvider,
    setSelectedModelProvider,
    handleAddProvider,
    handleCheckKey,
    handleUpdateProvider,
  };
}
