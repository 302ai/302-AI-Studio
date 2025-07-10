import { triplitClient } from "@renderer/client";
import { EventNames, emitter } from "@renderer/services/event-service";
import { useQuery } from "@triplit/react";

import { useCallback, useEffect } from "react";

export function useAppShortcutListenser() {
  const shortcutsQuery = triplitClient
    .query("shortcuts")
    .Where("scope", "=", "app")
    .Order("createdAt", "DESC");
  const { results: appShortcuts } = useQuery(triplitClient, shortcutsQuery);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const pressedKeys: string[] = [];

      if (event.ctrlKey || event.metaKey) {
        pressedKeys.push("Cmd");
      }
      if (event.shiftKey) {
        pressedKeys.push("Shift");
      }
      if (event.altKey) {
        pressedKeys.push("Alt");
      }

      if (
        event.key &&
        !["Control", "Meta", "Shift", "Alt"].includes(event.key)
      ) {
        let key = event.key;
        if (key === " ") key = "Space";
        else if (key === "Enter") key = "Enter";
        else if (key === "Backspace") key = "Backspace";
        else if (key === "Tab") key = "Tab";
        else if (key === "Escape") key = "Escape";
        else key = key.toUpperCase();

        pressedKeys.push(key);
      }

      if (pressedKeys.length === 0) return;

      for (const shortcut of appShortcuts || []) {
        if (arraysEqual(Array.from(shortcut.keys), pressedKeys)) {
          event.preventDefault();
          event.stopPropagation();

          emitter.emit(EventNames.SHORTCUT_TRIGGERED, {
            action: shortcut.action,
          });
          return;
        }
      }
    },
    [appShortcuts],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [handleKeyDown]);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, index) => val === sortedB[index]);
}
