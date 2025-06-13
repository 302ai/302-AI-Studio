import path from "node:path";
import { app } from "electron";

export const isMac = process.platform === "darwin";
export const isWin = process.platform === "win32";
export const isLinux = process.platform === "linux";
export const isDev = process.env.NODE_ENV === "development";

export const defaultLanguage = "zh-CN";

export const APP_NAME = "ChatChat";
export const DB_NAME = "chat.db";
export const DB_FOLDER = "app_db";
export const DB_CONFIG = {
  dbFileName: DB_NAME,
  timeout: 30 * 1000,
};

export function getAppDataPath() {
  if (process.platform === "darwin") {
    return path.join(app.getPath("userData"), DB_FOLDER);
  } else if (process.platform === "win32") {
    return path.join(process.env.APPDATA || "", "chat-chat-app", DB_FOLDER);
  } else {
    return path.join(app.getPath("userData"), DB_FOLDER);
  }
}

export function getDbPath() {
  return path.join(getAppDataPath(), DB_NAME);
}
