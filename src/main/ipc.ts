import { IpcChannel } from "@/shared/ipc-channel";
import logger from "@/shared/logger";
import { type BrowserWindow, ipcMain } from "electron";

export function registerIpc(mainWindow: BrowserWindow, app: Electron.App) {
  // Window
  ipcMain.handle(IpcChannel.WINDOW_MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.handle(IpcChannel.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle(IpcChannel.WINDOW_CLOSE, () => {
    mainWindow.close();
  });

  ipcMain.handle(IpcChannel.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow.isMaximized();
  });

  // Send maximize/unmaximize events to renderer
  mainWindow.on("maximize", () => {
    logger.info("Window maximized");
    mainWindow.webContents.send(IpcChannel.WINDOW_MAXIMIZED);
  });

  mainWindow.on("unmaximize", () => {
    logger.info("Window unmaximized");
    mainWindow.webContents.send(IpcChannel.WINDOW_UNMAXIMIZED);
  });
}
