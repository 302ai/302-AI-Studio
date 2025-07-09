import { triplitClient } from "@renderer/client";
import type { CreateShortcutData, ShortcutAction } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { useCallback, useMemo, useRef } from "react";

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

const DEFAULT_SHORTCUTS: CreateShortcutData[] = [
  { action: "send-message", keys: new Set(["Enter"]) },
  { action: "new-chat", keys: new Set(["Cmd", "N"]) },
  { action: "clear-messages", keys: new Set(["Cmd", "L"]) },
  { action: "close-current-tab", keys: new Set(["Cmd", "Shift", "W"]) },
  { action: "close-other-tabs", keys: new Set(["Cmd", "W"]) },
  { action: "delete-current-thread", keys: new Set(["Cmd", "Backspace"]) },
  { action: "open-settings", keys: new Set(["Cmd", ","]) },
  { action: "toggle-sidebar", keys: new Set(["Cmd", "B"]) },
];

export function useShortcuts() {
  const shortcutsQuery = triplitClient.query("shortcuts");
  const { results: shortcuts } = useQuery(triplitClient, shortcutsQuery);
  const isInitializedRef = useRef(false);

  const initializeShortcuts = useCallback(async () => {
    if (isInitializedRef.current || !shortcuts) return;

    const shortcutsArray = Array.from(shortcuts.values() || []);

    if (shortcutsArray.length === 0) {
      isInitializedRef.current = true;
      for (const shortcut of DEFAULT_SHORTCUTS) {
        await triplitClient.insert("shortcuts", shortcut);
      }
    } else {
      isInitializedRef.current = true;
    }
  }, [shortcuts]);

  const getShortcuts = useMemo((): ShortcutConfig => {
    const shortcutsArray = Array.from(shortcuts?.values() || []);
    const config: ShortcutConfig = {
      "send-message": { keys: ["Enter"] },
      "new-chat": { keys: ["Cmd", "N"] },
      "clear-messages": { keys: ["Cmd", "L"] },
      "close-current-tab": { keys: ["Cmd", "Shift", "W"] },
      "close-other-tabs": { keys: ["Cmd", "W"] },
      "delete-current-thread": { keys: ["Cmd", "Backspace"] },
      "open-settings": { keys: ["Cmd", ","] },
      "toggle-sidebar": { keys: ["Cmd", "B"] },
    };

    const sortedShortcuts = shortcutsArray.sort((a, b) => {
      const aTime = a.updatedAt?.getTime() || a.createdAt?.getTime() || 0;
      const bTime = b.updatedAt?.getTime() || b.createdAt?.getTime() || 0;
      return bTime - aTime;
    });

    const processedActions = new Set<string>();
    for (const shortcut of sortedShortcuts) {
      if (
        shortcut.action &&
        shortcut.keys &&
        !processedActions.has(shortcut.action)
      ) {
        config[shortcut.action as keyof ShortcutConfig] = {
          keys: Array.from(shortcut.keys),
        };
        processedActions.add(shortcut.action);
      }
    }

    return config;
  }, [shortcuts]);

  const updateShortcut = useCallback(
    async (action: ShortcutAction, keys: string[]) => {
      const shortcutsArray = Array.from(shortcuts?.values() || []);

      const existingShortcuts = shortcutsArray.filter(
        (s) => s.action === action,
      );

      if (existingShortcuts.length > 0) {
        for (const shortcut of existingShortcuts) {
          await triplitClient.delete("shortcuts", shortcut.id);
        }
      }

      await triplitClient.insert("shortcuts", {
        action,
        keys: new Set(keys),
      });
    },
    [shortcuts],
  );

  const isShortcutPressed = useCallback(
    (event: KeyboardEvent, shortcutKeys: string[]): boolean => {
      if (event.isComposing) {
        return false;
      }

      const pressedKeys: string[] = [];

      if (event.ctrlKey) pressedKeys.push("Ctrl");
      if (event.metaKey) pressedKeys.push("Cmd");
      if (event.shiftKey) pressedKeys.push("Shift");
      if (event.altKey) pressedKeys.push("Alt");

      if (
        event.key &&
        !["Control", "Meta", "Shift", "Alt"].includes(event.key)
      ) {
        pressedKeys.push(event.key);
      }

      const normalizeKeys = (keys: string[]) => {
        return keys
          .map((key) => {
            switch (key.toLowerCase()) {
              case "cmd":
              case "meta":
              case "ctrl":
              case "control":
                return "CmdCtrl";
              case "shift":
                return "Shift";
              case "alt":
                return "Alt";
              case "enter":
                return "Enter";
              default:
                return key.toUpperCase();
            }
          })
          .sort();
      };

      const normalizedPressed = normalizeKeys(pressedKeys);
      const normalizedShortcut = normalizeKeys(shortcutKeys);

      const result =
        JSON.stringify(normalizedPressed) ===
        JSON.stringify(normalizedShortcut);

      return result;
    },
    [],
  );

  return {
    shortcuts: Array.from(shortcuts?.values() || []),
    initializeShortcuts,
    getShortcuts,
    updateShortcut,
    isShortcutPressed,
  };
}
