import { triplitClient } from "@renderer/client";
import type { Thread } from "@shared/triplit/types";
import { useQuery, useQueryOne } from "@triplit/react";
import { useCallback, useEffect, useState } from "react";

const { uiService } = window.service;

export function useActiveThread() {
  const [selectedThread, setSelectedThreadState] = useState<Thread | null>(
    null,
  );

  // Subscribe to UI state changes
  const uiQuery = triplitClient.query("ui");
  const { result: ui } = useQueryOne(triplitClient, uiQuery);

  // Subscribe to threads changes
  const threadsQuery = triplitClient.query("threads");
  const { results: threads } = useQuery(triplitClient, threadsQuery);

  // Get active thread ID from UI state
  const activeThreadId = ui?.activeThreadId || null;

  // Update selectedThread when activeThreadId changes
  useEffect(() => {
    if (!activeThreadId || !threads) {
      setSelectedThreadState(null);
      return;
    }

    const activeThread = threads.find((t) => t.id === activeThreadId);
    setSelectedThreadState(activeThread || null);
  }, [activeThreadId, threads]);

  const setActiveThreadId = useCallback(async (threadId: string) => {
    console.log("Setting active thread ID:", threadId || "none");
    await uiService.updateActiveThreadId(threadId || "");
  }, []);

  return {
    activeThreadId,
    selectedThread,
    setActiveThreadId,
  };
}
