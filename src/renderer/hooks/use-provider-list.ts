import type { CreateProviderData, Provider } from "@shared/triplit/types";
import type { ModelProvider } from "@shared/types/provider";
import { useState } from "react";
import {
  deleteModelsByProviderId,
  deleteProvider,
  insertModels,
  insertProvider,
  updateProvider,
} from "../services/provider-db-service";

const {  providerService } = window.service;

export type ModelActionType = "add" | "edit" | "delete";

export function useProviderList() {
  const [state, setState] = useState<ModelActionType | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );

  const closeModal = () => {
    setState(null);
  };

  const handleDelete = async () => {
    if (!selectedProvider) {
      closeModal();
      return;
    }

    await deleteProvider(selectedProvider.id);
    await deleteModelsByProviderId(selectedProvider.id);

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
  };

  const handleAddProvider = async (provider: CreateProviderData) => {
    const newProvider = await insertProvider(provider);
    const models = await providerService.fetchModels(newProvider);
    console.log("🚀 ~ :66 ~ handleAddProvider ~ models:", models);
    await insertModels(models);
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
        return updateProvider(provider.id, {
          order: index,
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Failed to move provider:", error);
    }
  };

  return {
    state,
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
