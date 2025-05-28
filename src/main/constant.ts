import { app } from 'electron';
import path from 'path';

export const isMac = process.platform === "darwin";
export const isWin = process.platform === "win32";
export const isLinux = process.platform === "linux";
export const isDev = process.env.NODE_ENV === "development";

export const defaultLanguage = "zh-CN";

export const APP_NAME = 'ChatChat';
export const DB_NAME = isDev ? "chatchat.dev.db" : "chatchat.db";
export const DB_CONFIG = {
  dbFileName: DB_NAME,
  timeout: 30 * 1000,
};

export function getAppDataPath() {
  if (process.platform === 'darwin') {
    return path.join(app.getPath('userData'));
  } else if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', APP_NAME);
  } else {
    return path.join(app.getPath('userData'));
  }
}
