import { type ElectronAPI, electronAPI } from "@electron-toolkit/preload";
import { initPreloadBridge } from "@main/bridge";
import type { CheckApiKeyParams } from "@main/services/provider-service";
import type { Model } from "@renderer/types/models";
import type { ModelProvider } from "@renderer/types/providers";
import type { LanguageVarious, ThemeMode } from "@renderer/types/settings";
import { contextBridge } from "electron";

/**
 * ! This should be declared in index.d.ts,
 * ! but declaring it in index.d.ts would result in an error: Property 'api' does not exist on type 'Window & typeof globalThis'.
 * ! For now, let's declare here that optimization is needed in the future
 */
declare global {
  interface Window {
    electron: ElectronAPI;
    api: WindowApiType;
    service: {
      configService: {
        getLanguage: () => Promise<LanguageVarious>;
        setLanguage: (language: LanguageVarious) => void;
        setTheme: (theme: ThemeMode) => void;
        setProviders: (providers: ModelProvider[]) => void;
        getProviderModels: (providerId: string) => Promise<Model[]>;
      };
      threadsService: {
        setActiveThread: (threadId: string) => void;
      };
      providerService: {
        checkApiKey: (params: CheckApiKeyParams) => Promise<{
          isOk: boolean;
          errorMsg: string | null;
        }>;
        updateProviderConfig: (
          providerId: string,
          updates: Partial<ModelProvider>
        ) => void;
      };
    };
  }
}

const api = {
  platform: process.platform,
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
