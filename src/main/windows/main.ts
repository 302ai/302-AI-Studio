import { BrowserWindow } from "electron";
import { join } from "node:path";
import { createWindow } from "@lib/electron-app/factories/windows/create";
import { is } from "@electron-toolkit/utils";
import { isLinux, isMac } from "../constant";
import windowStateKeeper from "electron-window-state";
import { titleBarOverlayLight } from "../config";

export async function MainWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1080,
    defaultHeight: 670,
    fullScreen: false,
    maximize: false,
  });

  const window = createWindow({
    id: "home",
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1080,
    minHeight: 600,
    autoHideMenuBar: true,
    transparent: isMac,
    visualEffectState: "active",
    titleBarStyle: isLinux ? "default" : "hidden",
    titleBarOverlay: titleBarOverlayLight,
    // backgroundColor: isMac ? undefined : theme === 'dark' ? '#181818' : '#FFFFFF',
    trafficLightPosition: { x: 8, y: 12 },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
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
