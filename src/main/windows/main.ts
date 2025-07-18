import { join } from "node:path";
import { createWindow } from "@lib/electron-app/factories/windows/create";
import { WINDOW_SIZE } from "@shared/constants";
import { BrowserWindow, nativeImage, nativeTheme } from "electron";
import windowStateKeeper from "electron-window-state";
import icon from "../../resources/build/icons/302ai.png?asset";
import iconWin from "../../resources/build/icons/win-logo.ico?asset";
import { titleBarOverlayDark, titleBarOverlayLight } from "../config";
import { isDev, isLinux, isMac, isWin } from "../constant";

export async function MainWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: WINDOW_SIZE.MIN_WIDTH,
    defaultHeight: WINDOW_SIZE.MIN_HEIGHT,
    fullScreen: false,
    maximize: false,
  });

  const iconFile = nativeImage.createFromPath(icon);
  const iconFileWin = nativeImage.createFromPath(iconWin);
  const { shouldUseDarkColors } = nativeTheme;

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
    frame: isLinux ? false : undefined,
    icon: isWin ? iconFileWin : iconFile,
    visualEffectState: "active",
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    titleBarOverlay: !isMac
      ? shouldUseDarkColors
        ? titleBarOverlayDark
        : titleBarOverlayLight
      : undefined,
    backgroundColor: shouldUseDarkColors ? "#181818" : "#FFFFFF",
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined,
    ...(isLinux && {
      thickFrame: false,
      resizable: true,
      skipTaskbar: false,
    }),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      devTools: isDev,
    },
    roundedCorners: true,
  });

  mainWindowState.manage(window);

  window.webContents.on("did-finish-load", () => {
    window.show();
  });

  window.on("close", () => {
    BrowserWindow.getAllWindows().forEach((win) => win.destroy());
  });

  return window;
}
