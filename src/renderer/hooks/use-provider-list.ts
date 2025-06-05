import type { CreateProviderData, Provider } from "@shared/triplit/types";
import type { ModelProvider } from "@shared/types/provider";
import { useState } from "react";
import { DEFAULT_PROVIDERS } from "../config/providers";
import { useModelSettingStore } from "../store/settings-store/model-setting-store";

const { configService, providerService } = window.service;

export type ModelActionType = "add" | "edit" | "delete";

export function useProviderList() {
  const {
    modelProviders,
    updateSelectedModelProvider,
  } = useModelSettingStore();

  const [state, setState] = useState<ModelActionType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );

  // * Show providers that are NOT already in the modelProvider array
  const canSelectProviders = DEFAULT_PROVIDERS.filter(
    (initialProvider) =>
      !modelProviders.some(
        (existingProvider) => existingProvider.id === initialProvider.id,
      ),
  );

  const closeModal = () => {
    setState(null);
  };

  const handleDelete = async () => {
    if (!selectedProvider) {
      closeModal();
      return;
    }

    await configService.deleteProvider(selectedProvider.id);
    setSelectedProvider(null);
  };

  const handleUpdateProvider = (updatedProvider: ModelProvider) => {
    const { name, baseUrl, apiKey, apiType } = updatedProvider;

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
  };

  const handleAddProvider = async (provider: CreateProviderData) => {
    const newProvider = await configService.addProvider(provider);
    const models = await providerService.fetchModels(newProvider);
    console.log("🚀 ~ :66 ~ handleAddProvider ~ models:", models);
    await configService.addModels(models);
  };

  const handleCheckKey = async (
    providerCfg: ModelProvider,
    condition: "add" | "edit",
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

  // * Move provider using triplit instead of store
  const moveProvider = async (
    fromIndex: number,
    toIndex: number,
    providers: Provider[],
  ) => {
    try {
      // Create a copy of providers array to work with
      const updatedProviders = [...providers];
      const [movedProvider] = updatedProviders.splice(fromIndex, 1);
      updatedProviders.splice(toIndex, 0, movedProvider);

      // Update the order for all affected providers
      const updatePromises = updatedProviders.map((provider, index) => {
        return configService.updateProvider(provider.id, {
          order: index,
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Failed to move provider:", error);
    }
  };

  return {
    modelProviders,
    state,
    canSelectProviders,
    setState,
    closeModal,
    handleDelete,
    handleAddProvider,
    handleCheckKey,
    handleUpdateProvider,

    selectedProvider,
    setSelectedProvider,
    moveProvider,
  };
}
