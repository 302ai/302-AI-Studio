import { useEffect } from "react";
import { type ShortcutConfig, useShortcuts } from "./use-shortcuts";

export function useKeyboardShortcuts(
  shortcutAction: keyof ShortcutConfig,
  callback: () => void,
  enabled: boolean = true,
) {
  const { getShortcuts, isShortcutPressed } = useShortcuts();

  useEffect(() => {
    if (!enabled) return;

    const shortcuts = getShortcuts;
    const shortcutKeys = shortcuts[shortcutAction]?.keys;

    if (!shortcutKeys || shortcutKeys.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isShortcutPressed(event, shortcutKeys)) {
        event.preventDefault();
        event.stopPropagation();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcutAction, callback, enabled, getShortcuts, isShortcutPressed]);
}
