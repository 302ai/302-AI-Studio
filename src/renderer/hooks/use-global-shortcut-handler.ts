import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import type { ShortcutAction } from "@shared/triplit/types";
import { useEffect } from "react";

export function useGlobalShortcutHandler(
  action: ShortcutAction,
  handler: () => void,
) {
  useEffect(() => {
    const handleShortcut = (data: { action: ShortcutAction }) => {
      if (data.action === action) {
        logger.debug("Shortcut triggered", {
          action: data.action,
        });

        handler();
      }
    };

    const unsubscribe = emitter.on(
      EventNames.SHORTCUT_TRIGGERED,
      handleShortcut,
    );
    return unsubscribe;
  }, [action, handler]);
}
