import { triplitClient } from "@renderer/client";
import type { Model, Provider } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useState } from "react";

interface UseModelSelectOptions {
  onSelect?: (modelId: string) => void | Promise<void>;
}

interface UseModelSelectReturn {
  providers: Provider[];
  models: Model[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  handleToggleOpen: () => void;
  handleModelSelect: (modelId: string) => void;
  isLoading: boolean;
}

export function useModelSelect(options: UseModelSelectOptions = {}): UseModelSelectReturn {
  const { onSelect } = options;

  // Query enabled providers ordered by order
  const providersQuery = triplitClient
    .query("providers")
    .Where("enabled", "=", true)
    .Order("order", "ASC");

  const { results: providers = [], fetching: providersFetching } = useQuery(
    triplitClient,
    providersQuery,
  );

  // Query enabled models ordered by collected status and name
  const modelsQuery = triplitClient
    .query("models")
    .Where("enabled", "=", true)
    .Order("collected", "DESC")
    .Order("name", "ASC");

  const { results: models = [], fetching: modelsFetching } = useQuery(
    triplitClient,
    modelsQuery,
  );

  // Modal state management
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleModelSelect = useCallback(
    async (modelId: string) => {
      setIsOpen(false);
      if (onSelect) {
        await onSelect(modelId);
      }
    },
    [onSelect],
  );

  const isLoading = providersFetching || modelsFetching;

  return {
    providers,
    models,
    isOpen,
    setIsOpen,
    handleToggleOpen,
    handleModelSelect,
    isLoading,
  };
}
