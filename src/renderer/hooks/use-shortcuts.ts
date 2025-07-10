import { triplitClient } from "@renderer/client";
import type { ShortcutAction, ShortcutScope } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useMemo } from "react";

export interface ShortcutKeys {
  keys: string[];
}

export interface ShortcutConfig {
  "send-message": ShortcutKeys;
  "new-chat": ShortcutKeys;
  "clear-messages": ShortcutKeys;
  "close-current-tab": ShortcutKeys;
  "close-other-tabs": ShortcutKeys;
  "delete-current-thread": ShortcutKeys;
  "open-settings": ShortcutKeys;
  "toggle-sidebar": ShortcutKeys;
}

const { shortcutsService } = window.service;

export function useShortcuts() {
  const shortcutsQuery = triplitClient
    .query("shortcuts")
    .Order("createdAt", "DESC");
  const { results: allShortcuts } = useQuery(triplitClient, shortcutsQuery);
  const globalShortcuts = useMemo(() => {
    return allShortcuts?.filter((s) => s.scope === "global") || [];
  }, [allShortcuts]);

  const appShortcuts = useMemo(() => {
    return allShortcuts?.filter((s) => s.scope === "app") || [];
  }, [allShortcuts]);

  const updateShortcut = useCallback(
    async (
      action: ShortcutAction,
      keys: string[],
      scope: ShortcutScope = "app",
    ) => {
      try {
        await shortcutsService.updateShortcut(action, keys, scope);
      } catch (error) {
        console.error("Failed to update shortcut:", error);
      }
    },
    [],
  );

  return {
    globalShortcuts,
    appShortcuts,
    allShortcuts,
    updateShortcut,
  };
}
