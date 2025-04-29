import { ElectronAPI } from "@electron-toolkit/preload";

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
