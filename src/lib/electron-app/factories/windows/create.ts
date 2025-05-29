import { join } from "node:path";
import { registerRoute } from "@lib/electron-router-dom";
import { BrowserWindow } from "electron";
import type { WindowProps } from "@/src/shared/electron-router";

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
