import type { ModelProvider } from "@renderer/types/providers";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const MODEL_SETTING_STORAGE_KEY = "model-setting";

interface ModelSettingStore {
  modelProvider: ModelProvider[];
  selectedModelProvider: ModelProvider | null;

  addModelProvider: (newProvider: ModelProvider) => void;
  moveModelProvider: (fromIndex: number, toIndex: number) => void;
  removeModelProvider: (providerId: string) => void;
  setSelectedModelProvider: (provider: ModelProvider | null) => void;
}

export const useModelSettingStore = create<ModelSettingStore>()(
  persist(
    immer((set, get) => ({
      modelProvider: [],
      selectedModelProvider: null,

      addModelProvider: (newProvider) => {
        set({ modelProvider: [...get().modelProvider, newProvider] });
      },

      moveModelProvider: (fromIndex, toIndex) => {
        set((state) => {
          const provider = state.modelProvider[fromIndex];
          state.modelProvider.splice(fromIndex, 1);
          state.modelProvider.splice(toIndex, 0, provider);
          return state;
        });
      },

      setSelectedModelProvider: (provider) => {
        set({ selectedModelProvider: provider });
      },

      removeModelProvider: (providerId) => {
        set((state) => {
          state.modelProvider = state.modelProvider.filter(
            (provider) => provider.id !== providerId
          );

          return state;
        });
      },
    })),
    {
      name: MODEL_SETTING_STORAGE_KEY,
    }
  )
);
