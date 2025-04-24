import { BrowserWindow } from "electron";
import { join } from "node:path";
import { createWindow } from "@/lib/electron-app/factories/windows/create";
import { displayName } from "~/package.json";
import { is } from "@electron-toolkit/utils";

export async function MainWindow() {
  const window = createWindow({
    id: "main",
    title: displayName,
    width: 1024,
    height: 620,
    show: false,
    center: true,
    movable: true,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      devTools: is.dev,
    },
  });

  window.webContents.on("did-finish-load", () => {
    window.show();
  });

  window.on("close", () => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.destroy();
    }
  });

  return window;
}
