import { join } from "node:path";
import { is } from "@electron-toolkit/utils";
import { createWindow } from "@lib/electron-app/factories/windows/create";
import { BrowserWindow } from "electron";
import ElectronStore from "electron-store";
import windowStateKeeper from "electron-window-state";
import { titleBarOverlayDark, titleBarOverlayLight } from "../config";
import { isLinux, isMac } from "../constant";

export async function MainWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1080,
    defaultHeight: 720,
    fullScreen: false,
    maximize: false,
  });

  const theme = new ElectronStore().get("theme", "light");

  const window = createWindow({
    id: "main",
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1080,
    minHeight: 720,
    autoHideMenuBar: true,
    transparent: isMac,
    visualEffectState: "active",
    titleBarStyle: isLinux ? "default" : "hidden",
    titleBarOverlay:
      theme === "dark" ? titleBarOverlayDark : titleBarOverlayLight,
    backgroundColor: isMac
      ? undefined
      : theme === "dark"
      ? "#181818"
      : "#FFFFFF",
    trafficLightPosition: { x: 8, y: 12 },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      devTools: is.dev,
      webSecurity: false,
      webviewTag: true,
      allowRunningInsecureContent: true,
    },
  });

  mainWindowState.manage(window);

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
