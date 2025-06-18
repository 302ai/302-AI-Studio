import { join } from "node:path";
import { createWindow } from "@lib/electron-app/factories/windows/create";
import { WINDOW_SIZE } from "@shared/constants";
import { BrowserWindow } from "electron";
import ElectronStore from "electron-store";
import windowStateKeeper from "electron-window-state";
import { titleBarOverlayDark, titleBarOverlayLight } from "../config";
import { isDev, isMac, isWin } from "../constant";

export async function MainWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: WINDOW_SIZE.MIN_WIDTH,
    defaultHeight: WINDOW_SIZE.MIN_HEIGHT,
    fullScreen: false,
    maximize: false,
  });

  const theme = new ElectronStore().get("theme", "dark");

  const window = createWindow({
    id: "main",
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: WINDOW_SIZE.MIN_WIDTH,
    minHeight: WINDOW_SIZE.MIN_HEIGHT,
    autoHideMenuBar: true,
    transparent: isMac,
    icon: join(__dirname, "../../../src/resources/public/302ai.png"),
    visualEffectState: "active",
    titleBarStyle: isWin ? "hidden" : "hiddenInset",
    titleBarOverlay:
      theme === "dark" ? titleBarOverlayDark : titleBarOverlayLight,
    backgroundColor: isMac
      ? undefined
      : theme === "dark"
        ? "#181818"
        : "#FFFFFF",
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      devTools: isDev,
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
