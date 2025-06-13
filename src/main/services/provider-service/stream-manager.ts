import Logger from "electron-log";

// A map to hold AbortController instances for each stream.
const streamAbortControllers = new Map<string, AbortController>();

// Each tab can only have one stream at a time, so the key is simply the tabId.
function getStreamKey(tabId: string): string {
  return tabId;
}

/**
 * Create (or replace) an AbortController for the given tab.
 */
export function createAbortController(tabId: string): AbortController {
  const key = getStreamKey(tabId);
  // If there's an existing controller, abort it before creating a new one.
  const existing = streamAbortControllers.get(key);
  if (existing) {
    existing.abort();
  }

  const controller = new AbortController();
  streamAbortControllers.set(key, controller);
  return controller;
}

/**
 * Clean up the AbortController after the stream is done.
 */
export function cleanupAbortController(tabId: string): void {
  const key = getStreamKey(tabId);
  streamAbortControllers.delete(key);
}

/**
 * Abort an ongoing streaming operation for the given tab.
 * Returns true if a running stream was found and aborted.
 */
export function abortStream(tabId: string): boolean {
  const key = getStreamKey(tabId);
  const controller = streamAbortControllers.get(key);

  if (controller) {
    controller.abort();
    streamAbortControllers.delete(key);
    Logger.info(`Stream generation stopped for tab: ${tabId}`);
    return true;
  }

  Logger.warn(`No active stream found for tab: ${tabId}`);
  return false;
}
