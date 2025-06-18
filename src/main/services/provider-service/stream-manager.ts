import Logger from "electron-log";

// A map to hold AbortController instances for each stream.
const streamAbortControllers = new Map<string, AbortController>();

// Each tab can only have one stream at a time, so the key is simply the tabId.
function getStreamKey(threadId: string): string {
  return threadId;
}

/**
 * Create (or replace) an AbortController for the given tab.
 */
export function createAbortController(threadId: string): AbortController {
  const key = getStreamKey(threadId);
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
export function cleanupAbortController(threadId: string): void {
  const key = getStreamKey(threadId);
  streamAbortControllers.delete(key);
}

/**
 * Abort an ongoing streaming operation for the given tab.
 * Returns true if a running stream was found and aborted.
 */
export function abortStream(threadId: string): boolean {
  const key = getStreamKey(threadId);
  const controller = streamAbortControllers.get(key);

  if (controller) {
    controller.abort();
    streamAbortControllers.delete(key);
    Logger.info(`Stream generation stopped for tab: ${threadId}`);
    return true;
  }

  Logger.warn(`No active stream found for tab: ${threadId}`);
  return false;
}
