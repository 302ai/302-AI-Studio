import { electronAPI } from "@electron-toolkit/preload";
import { initPreloadBridge } from "@main/bridge";
import { contextBridge, webUtils } from "electron";

const api = {
  platform: process.platform,
  webUtils: {
    getPathForFile: webUtils.getPathForFile,
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
    contextBridge.exposeInMainWorld("service", initPreloadBridge());
  } catch (error) {
    console.error("Error exposing services:", error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}

export type WindowApiType = typeof api;
