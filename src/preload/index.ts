import { IpcChannel } from "@/shared/ipc-channel";
import { exposeElectronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      sayHelloFromBridge: () => void;

      username: string;

      platform: string;

      window: {
        isMaximized: () => Promise<boolean>;
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        onMaximizeChange: (
          callback: (isMaximized: boolean) => void
        ) => (() => void) | undefined;
      };
    };
  }
}

const api = {
  sayHelloFromBridge: () => console.log("\nHello from bridgeAPI! 👋\n\n"),
  username: process.env.USER,

  // Platform info
  platform: process.platform,

  // Window
  window: {
    minimize: () => ipcRenderer.invoke(IpcChannel.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IpcChannel.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(IpcChannel.WINDOW_CLOSE),
    isMaximized: () => ipcRenderer.invoke(IpcChannel.WINDOW_IS_MAXIMIZED),

    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      const maximizedListener = () => callback(true);
      const unmaximizedListener = () => callback(false);

      ipcRenderer.on(IpcChannel.WINDOW_MAXIMIZED, maximizedListener);
      ipcRenderer.on(IpcChannel.WINDOW_UNMAXIMIZED, unmaximizedListener);

      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener(
          IpcChannel.WINDOW_MAXIMIZED,
          maximizedListener
        );
        ipcRenderer.removeListener(
          IpcChannel.WINDOW_UNMAXIMIZED,
          unmaximizedListener
        );
      };
    },
  },
};

exposeElectronAPI();
contextBridge.exposeInMainWorld("api", api);
