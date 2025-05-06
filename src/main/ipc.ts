import { IpcChannel } from "@shared/ipc-channel";
import { type BrowserWindow, ipcMain } from "electron";
import { configManager } from "./services/config-service";

export function registerIpc(mainWindow: BrowserWindow, app: Electron.App) {
  // Language
  ipcMain.handle(IpcChannel.APP_SET_LANGUAGE, (_, lang) => {
    configManager.setLanguage(lang);
  });
  ipcMain.handle(IpcChannel.APP_GET_LANGUAGE, () => {
    return configManager.getLanguage();
  });
  // Theme
  ipcMain.handle(IpcChannel.APP_SET_THEME, (_, theme) => {
    configManager.setTheme(theme);
  });
  ipcMain.handle(IpcChannel.APP_GET_THEME, () => {
    return configManager.getTheme();
  });
}
