import { triplitClient } from "@shared/triplit/client";
import type { Provider } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useEffect, useState } from "react";
import { updateActiveProviderId } from "../services/db-services/ui-db-service";

export function useActiveProvider() {
  const [selectedProvider, setSelectedProviderState] = useState<Provider | null>(null);

  // Subscribe to UI state changes
  const uiQuery = triplitClient.query("ui");
  const { results: uiResults } = useQuery(triplitClient, uiQuery);

  // Subscribe to providers changes
  const providersQuery = triplitClient.query("providers");
  const { results: providers } = useQuery(triplitClient, providersQuery);

  // Get active provider ID from UI state
  const activeProviderId = uiResults?.[0]?.activeProviderId || null;

  // Update selectedProvider when activeProviderId changes
  useEffect(() => {
    if (!activeProviderId || !providers) {
      setSelectedProviderState(null);
      return;
    }

    const activeProvider = providers.find(p => p.id === activeProviderId);
    setSelectedProviderState(activeProvider || null);
  }, [activeProviderId, providers]);

  const setSelectedProvider = useCallback(async (provider: Provider | null) => {
    console.log("Setting selected provider:", provider?.name || "none");
    await updateActiveProviderId(provider?.id || "");
  }, []);

  return {
    selectedProvider,
    setSelectedProvider,
  };
}
