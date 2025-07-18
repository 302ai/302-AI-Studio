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
      if (event.isComposing) return;

      const pressedKeys: string[] = [];

      if (event.ctrlKey) {
        pressedKeys.push("Ctrl");
      }
      if (event.metaKey) {
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
        const shortcutKeys = Array.from(shortcut.keys);

        // 检查直接匹配
        if (arraysEqual(shortcutKeys, pressedKeys)) {
          event.preventDefault();
          event.stopPropagation();

          emitter.emit(EventNames.SHORTCUT_TRIGGERED, {
            action: shortcut.action,
          });
          return;
        }

        // 跨平台兼容：如果快捷键定义中有 Cmd，也尝试用 Ctrl 匹配
        if (shortcutKeys.includes("Cmd")) {
          const crossPlatformKeys = shortcutKeys.map((key) =>
            key === "Cmd" ? "Ctrl" : key,
          );
          if (arraysEqual(crossPlatformKeys, pressedKeys)) {
            event.preventDefault();
            event.stopPropagation();

            emitter.emit(EventNames.SHORTCUT_TRIGGERED, {
              action: shortcut.action,
            });
            return;
          }
        }

        // 跨平台兼容：如果快捷键定义中有 Ctrl，也尝试用 Cmd 匹配
        if (shortcutKeys.includes("Ctrl")) {
          const crossPlatformKeys = shortcutKeys.map((key) =>
            key === "Ctrl" ? "Cmd" : key,
          );
          if (arraysEqual(crossPlatformKeys, pressedKeys)) {
            event.preventDefault();
            event.stopPropagation();

            emitter.emit(EventNames.SHORTCUT_TRIGGERED, {
              action: shortcut.action,
            });
            return;
          }
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
