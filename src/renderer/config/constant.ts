export const platform = window.electron?.process?.platform;
export const isMac = platform === "darwin";
export const isWindows = platform === "win32" || platform === "win64";
export const isLinux = platform === "linux";
export const isDev = process.env.NODE_ENV === "development";