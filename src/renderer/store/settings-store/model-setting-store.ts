import { Logger } from "@renderer/config/logger";
import type { Model } from "@renderer/types/models";
import type { ModelProvider } from "@renderer/types/providers";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ModelSettingStore {
  modelProviders: ModelProvider[];
  selectedModelProvider: ModelProvider | null;
  providerModelMap: Record<string, Model[]>;

  initializeStore: () => Promise<void>;

  addModelProvider: (newProvider: ModelProvider) => void;
  moveModelProvider: (fromIndex: number, toIndex: number) => void;
  removeModelProvider: (providerId: string) => void;
  setSelectedModelProvider: (provider: ModelProvider | null) => void;
  updateSelectedModelProvider: (data: Partial<ModelProvider>) => void;
  setProviderModelMap: (providerId: string, models: Model[]) => void;
  updateProviderModelMap: (providerId: string, models: Model[]) => void;
  getAllModels: (options?: { collected: boolean }) => Model[];
  getModelsByProvider: (
    providerId?: string,
    options?: { collected: boolean }
  ) => Model[];
}

const { configService } = window.service;

export const useModelSettingStore = create<ModelSettingStore>()(
  immer((set, get) => ({
    modelProviders: [],
    selectedModelProvider: null,
    providerModelMap: {},

    initializeStore: async () => {
      const modelSettings = await configService.getModelSettings();

      set({
        modelProviders: modelSettings.modelProviders,
        providerModelMap: modelSettings.providerModelMap,
      });
    },

    addModelProvider: (newProvider) => {
      set({
        modelProviders: [newProvider, ...get().modelProviders],
      });
    },

    moveModelProvider: (fromIndex, toIndex) => {
      set((state) => {
        const provider = state.modelProviders[fromIndex];
        state.modelProviders.splice(fromIndex, 1);
        state.modelProviders.splice(toIndex, 0, provider);
        return state;
      });
    },

    setSelectedModelProvider: (provider) => {
      set({ selectedModelProvider: provider });
      Logger.info("setSelectedModelProvider: ", provider?.name);
    },

    updateSelectedModelProvider: (data) => {
      set((state) => {
        if (!state.selectedModelProvider) return;

        state.selectedModelProvider = {
          ...state.selectedModelProvider,
          ...data,
        };

        state.modelProviders = state.modelProviders.map((provider) =>
          provider.id === state.selectedModelProvider?.id
            ? { ...provider, ...data }
            : provider
        );

        return state;
      });
    },

    removeModelProvider: (providerId) => {
      set((state) => {
        state.modelProviders = state.modelProviders.filter(
          (provider) => provider.id !== providerId
        );

        delete state.providerModelMap[providerId];

        return state;
      });
    },

    setProviderModelMap: (providerId, models) => {
      set((state) => {
        state.providerModelMap[providerId] = models;
      });
    },

    updateProviderModelMap: (providerId, models) => {
      set((state) => {
        state.providerModelMap[providerId] = models;
      });

      try {
        console.log(
          `Syncing models for provider: ${providerId}`,
          models.length
        );
        configService.setProviderModels(providerId, models);
      } catch (error) {
        console.error(
          `Failed to sync models for provider ${providerId}:`,
          error
        );
      }
    },

    getAllModels: (options?: { collected: boolean }) => {
      const { providerModelMap } = get();
      return Object.values(providerModelMap)
        .flat()
        .filter((model) => (options?.collected ? model.collected : true));
    },

    getModelsByProvider: (
      providerId?: string,
      options?: { collected: boolean }
    ) => {
      const { providerModelMap } = get();
      if (!providerId) {
        return Object.values(providerModelMap)
          .flat()
          .filter((model) => (options?.collected ? model.collected : true));
      }
      return (
        providerModelMap[providerId]?.filter((model) =>
          options?.collected ? model.collected : true
        ) || []
      );
    },
  }))
);

useModelSettingStore.getState().initializeStore();

/**
 * * This effect is used to sync the model providers to the main process
 */
useModelSettingStore.subscribe((state, prevState) => {
  if (state.modelProviders !== prevState.modelProviders) {
    configService.setProviders(state.modelProviders);
  }
});
