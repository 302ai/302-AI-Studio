import { useState } from "react";
import { useModelSettingStore } from "../store/settings-store/model-setting-store";

export type ModelActionType = "add" | "edit" | "delete";

export function useProviderList() {
  const {
    modelProviders,
    selectedModelProvider,
    moveModelProvider,
    setSelectedModelProvider,
    removeModelProvider,
  } = useModelSettingStore();

  const [state, setState] = useState<ModelActionType | null>(null);

  const closeModal = () => {
    setState(null);
  };

  const handleDelete = () => {
    if (!selectedModelProvider) return;

    removeModelProvider(selectedModelProvider.id);
    setSelectedModelProvider(null);
    closeModal();
  };

  return {
    modelProviders,
    selectedModelProvider,
    state,
    setState,
    closeModal,
    handleDelete,
    moveModelProvider,
    setSelectedModelProvider,
  };
}
