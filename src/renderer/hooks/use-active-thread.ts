import { triplitClient } from "@shared/triplit/client";
import type { Thread } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useEffect, useState } from "react";
import { updateActiveThreadId } from "../services/db-services/ui-db-service";

export function useActiveThread() {
  const [selectedThread, setSelectedThreadState] = useState<Thread | null>(null);

  // Subscribe to UI state changes
  const uiQuery = triplitClient.query("ui");
  const { results: uiResults } = useQuery(triplitClient, uiQuery);

  // Subscribe to threads changes
  const threadsQuery = triplitClient.query("threads");
  const { results: threads } = useQuery(triplitClient, threadsQuery);

  // Get active thread ID from UI state
  const activeThreadId = uiResults?.[0]?.activeThreadId || null;

  // Update selectedThread when activeThreadId changes
  useEffect(() => {
    if (!activeThreadId || !threads) {
      setSelectedThreadState(null);
      return;
    }

    const activeThread = threads.find(t => t.id === activeThreadId);
    setSelectedThreadState(activeThread || null);
  }, [activeThreadId, threads]);

  const setActiveThreadId = useCallback(async (threadId: string) => {
    console.log("Setting active thread ID:", threadId || "none");
    await updateActiveThreadId(threadId || "");
  }, []);

  return {
    activeThreadId,
    selectedThread,
    setActiveThreadId,
  };
}
