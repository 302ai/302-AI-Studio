import pkg from "../../package.json";

export const isMac = process.platform === "darwin";
export const isWin = process.platform === "win32";
export const isLinux = process.platform === "linux";
export const isDev = process.env.NODE_ENV === "development";

export const defaultLanguage = "zh-CN";

export const APP_NAME = pkg.name;
export const DB_NAME = isDev ? "chatchat.dev.db" : "chatchat.db";
export const DB_CONFIG = {
  dbFileName: DB_NAME,
  timeout: 30 * 1000,
};
