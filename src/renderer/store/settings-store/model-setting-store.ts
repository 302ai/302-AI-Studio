import { INITIAL_PROVIDERS } from "@renderer/config/providers";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { ModelProvider } from "@types";

const MODEL_SETTING_STORAGE_KEY = "model-setting";

interface ModelSettingStore {
  modelProvider: ModelProvider[];

  addModelProvider: (newProvider: ModelProvider) => void;
  moveModelProvider: (fromIndex: number, toIndex: number) => void;
}

export const useModelSettingStore = create<ModelSettingStore>()(
  persist(
    immer((set, get) => ({
      modelProvider: INITIAL_PROVIDERS,

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
    })),
    {
      name: MODEL_SETTING_STORAGE_KEY,
    }
  )
);
