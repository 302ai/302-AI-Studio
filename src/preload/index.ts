import { ElectronAPI, electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel } from "../shared/ipc-channel";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      sayHelloFromBridge: () => void;
      // Language
      setLanguage: (lang: string) => void;
      // Platform
      platform: string;
    };
  }
}

const api = {
  sayHelloFromBridge: () => console.log("\nHello from bridgeAPI! 👋\n\n"),
  // Language
  setLanguage: (lang: string) =>
    ipcRenderer.invoke(IpcChannel.APP_SET_LANGUAGE, lang),
  // Platform info
  platform: process.platform,
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
