import { useState } from "react";
import { DEFAULT_PROVIDERS } from "../config/providers";
import { useModelSettingStore } from "../store/settings-store/model-setting-store";
import type { ModelProvider } from "../types/providers";

const { providerService } = window.service;

export type ModelActionType = "add" | "edit" | "delete";

export function useProviderList() {
  const {
    modelProviders,
    selectedModelProvider,
    moveModelProvider,
    setSelectedModelProvider,
    removeModelProvider,
    addModelProvider,
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
    if (!selectedModelProvider) return;

    removeModelProvider(selectedModelProvider.id);
    setSelectedModelProvider(null);
    closeModal();
  };

  const handleAddProvider = (provider: ModelProvider) => {
    addModelProvider(provider);
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
      return await providerService.checkApiKey({
        condition,
        providerId: providerCfg.id,
      });
    }

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
    setState,
    closeModal,
    handleDelete,
    moveModelProvider,
    setSelectedModelProvider,
    handleAddProvider,
    handleCheckKey,
  };
}
