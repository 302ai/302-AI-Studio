import { IpcChannel } from "@shared/ipc-channel";
import { type BrowserWindow, ipcMain } from "electron";
import { configService } from "./services/config-service";
import { windowService } from "./services/window-service";

export function registerIpc(mainWindow: BrowserWindow, app: Electron.App) {
  // Language
  ipcMain.handle(IpcChannel.APP_SET_LANGUAGE, (_, lang) => {
    configService.setLanguage(lang);
  });
  ipcMain.handle(IpcChannel.APP_GET_LANGUAGE, () => {
    return configService.getLanguage();
  });
  // Theme
  ipcMain.handle(IpcChannel.APP_SET_THEME, (_, theme) => {
    if (theme === configService.getTheme()) return;

    configService.setTheme(theme);
    windowService.setTitleBarOverlay(mainWindow, theme);
  });
  ipcMain.handle(IpcChannel.APP_GET_THEME, () => {
    return configService.getTheme();
  });
}
