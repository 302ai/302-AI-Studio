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
