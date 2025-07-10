// Bridge between main process events and renderer process events
import type { ShortcutAction } from "@shared/triplit/types";
import { EventNames, emitter } from "./event-service";

const { electron } = window;

export function setupIpcEventBridge() {
  // Listen for shortcut events from main process
  electron.ipcRenderer.on(EventNames.SHORTCUT_TRIGGERED, (_, data: { action: ShortcutAction }) => {
    emitter.emit(EventNames.SHORTCUT_TRIGGERED, data);
  });

  // Add other event bridges here as needed
}

export function cleanupIpcEventBridge() {
  electron.ipcRenderer.removeAllListeners(EventNames.SHORTCUT_TRIGGERED);
}
