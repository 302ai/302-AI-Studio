import type { CreateProviderData, Provider } from "@shared/triplit/types";
import { useState } from "react";
import logger from "@shared/logger/renderer-logger";

const { configService, providerService } = window.service;

export type ModelActionType = "add" | "edit" | "delete";

export interface ModalAction {
  type: ModelActionType;
  provider?: Provider;
}

export function useProviderList() {
  const [state, setState] = useState<ModalAction | null>(null);

  const closeModal = () => {
    setState(null);
  };

  const handleDelete = async (selectedProvider: Provider) => {
    if (!selectedProvider) {
      closeModal();
      return;
    }

    await configService.deleteProvider(selectedProvider.id);
  };

  const handleUpdateProvider = async (updatedProvider: Provider) => {
    const { id, name, baseUrl, apiKey, apiType } = updatedProvider;
    await configService.updateProvider(id, {
      name,
      baseUrl,
      apiKey,
      apiType,
    });
    const models = await providerService.fetchModels(updatedProvider);
    await configService.updateProviderModels(id, models);
  };

  const handleAddProvider = async (provider: CreateProviderData) => {
    const newProvider = await configService.insertProvider(provider);
    const models = await providerService.fetchModels(newProvider);
    await configService.insertModels(models);
  };

  const handleCheckKey = async (
    providerCfg: Provider,
  ): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> => {
    return await providerService.checkApiKey(providerCfg);
  };

  const moveProvider = async (
    fromIndex: number,
    toIndex: number,
    providers: Provider[],
  ) => {
    try {
      const updatedProviders = [...providers];
      const [movedProvider] = updatedProviders.splice(fromIndex, 1);
      updatedProviders.splice(toIndex, 0, movedProvider);

      const updatePromises = updatedProviders.map((provider, index) => {
        return configService.updateProviderOrder(provider.id, index);
      });

      await Promise.all(updatePromises);
    } catch (error) {
      logger.error("Failed to move provider", { error });
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
    moveProvider,
  };
}
