import { join } from "node:path";
import { createWindow } from "@lib/electron-app/factories/windows/create";
import { MessageService } from "@main/services/message-service";
import { abortAllStreams } from "@main/services/provider-service/stream-manager";
import { WINDOW_SIZE } from "@shared/constants";
import { BrowserWindow, nativeImage, nativeTheme } from "electron";
import Logger from "electron-log";
import windowStateKeeper from "electron-window-state";
import icon from "../../resources/build/icons/302ai.png?asset";
import iconWin from "../../resources/build/icons/win-logo.ico?asset";
import { titleBarOverlayDark, titleBarOverlayLight } from "../config";
import { isDev, isMac, isWin } from "../constant";

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
    icon: isWin ? iconFileWin : iconFile,
    visualEffectState: "active",
    titleBarStyle: isWin ? "hidden" : "hiddenInset",
    titleBarOverlay: shouldUseDarkColors
      ? titleBarOverlayDark
      : titleBarOverlayLight,
    backgroundColor: isMac
      ? undefined
      : shouldUseDarkColors
        ? "#181818"
        : "#FFFFFF",
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined,
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

  window.on("close", async (event) => {
    event.preventDefault();
    try {
      const messageService = new MessageService();
      abortAllStreams();
      await messageService.updatePendingMessagesToStop();
    } catch (error) {
      Logger.error("Error during cleanup:", error);
    } finally {
      // 确保异步操作完成后才销毁
      BrowserWindow.getAllWindows().forEach((win) => win.destroy());
    }
  });

  return window;
}
