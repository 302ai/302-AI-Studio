import type { Model } from "@renderer/types/models";
import type { ModelProvider } from "@renderer/types/providers";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const MODEL_SETTING_STORAGE_KEY = "model-setting";

interface ModelSettingStore {
  modelProviders: ModelProvider[];
  selectedModelProvider: ModelProvider | null;
  providerModelMap: Record<string, Model[]>;

  addModelProvider: (newProvider: ModelProvider) => void;
  moveModelProvider: (fromIndex: number, toIndex: number) => void;
  removeModelProvider: (providerId: string) => void;
  setSelectedModelProvider: (provider: ModelProvider | null) => void;
  setProviderModelMap: (providerId: string, models: Model[]) => void;
  getAllModels: () => Model[];
}

const { configService } = window.service;

export const useModelSettingStore = create<ModelSettingStore>()(
  persist(
    immer((set, get) => ({
      modelProviders: [],
      selectedModelProvider: null,
      providerModelMap: {},

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

      getAllModels: () => {
        return Object.values(get().providerModelMap).flat();
      },
    })),
    {
      name: MODEL_SETTING_STORAGE_KEY,
    }
  )
);

/**
 * * This effect is used to sync the model providers to the main process
 */
useModelSettingStore.subscribe((state, prevState) => {
  if (state.modelProviders !== prevState.modelProviders) {
    configService.setProviders(state.modelProviders);
  }
});
