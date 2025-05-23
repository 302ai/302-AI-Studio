import { join } from "node:path";
import { registerRoute } from "@lib/electron-router-dom";

import type { WindowProps } from "@shared/types";
import { BrowserWindow } from "electron";

export function createWindow({ id, ...settings }: WindowProps) {
  const window = new BrowserWindow(settings);

  registerRoute({
    id,
    browserWindow: window,
    htmlFile: join(__dirname, "../renderer/index.html"),
  });

  window.on("closed", window.destroy);

  return window;
}
