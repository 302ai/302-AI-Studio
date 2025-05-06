import { ElectronAPI, electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel } from "../shared/ipc-channel";

/**
 * ! This should be declared in index.d.ts,
 * ! but declaring it in index.d.ts would result in an error: Property 'api' does not exist on type 'Window & typeof globalThis'.
 * ! For now, let's declare here that optimization is needed in the future
 */
declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      sayHelloFromBridge: () => Promise<void>;
      // Language
      setLanguage: (lang: string) => Promise<void>;
      getLanguage: () => Promise<string>;
      // Theme
      setTheme: (theme: string) => Promise<void>;
      getTheme: () => Promise<string>;
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
  getLanguage: () => ipcRenderer.invoke(IpcChannel.APP_GET_LANGUAGE),
  // Theme
  setTheme: (theme: string) =>
    ipcRenderer.invoke(IpcChannel.APP_SET_THEME, theme),
  getTheme: () => ipcRenderer.invoke(IpcChannel.APP_GET_THEME),
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
