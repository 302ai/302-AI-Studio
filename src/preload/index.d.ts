import type { ElectronAPI } from "@electron-toolkit/preload";
import type { CreateModelData, Provider } from "@shared/triplit/types";
import type { Model } from "@shared/types/model";
import type { LanguageVarious, ThemeMode } from "@shared/types/settings";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      platform: string;
    };
    service: {
      configService: {
        getLanguage: () => Promise<LanguageVarious>;
        setLanguage: (language: LanguageVarious) => void;
        setTheme: (theme: ThemeMode) => void;
        getProviderModels: (providerId: string) => Promise<Model[]>;
        setProviderModels: (providerId: string, models: Model[]) => void;
      };
      threadsService: {
        setActiveThreadId: (threadId: string) => void;
      };
      providerService: {
        checkApiKey: (provider: Provider) => Promise<{
          isOk: boolean;
          errorMsg: string | null;
        }>;
        fetchModels: (provider: Provider) => Promise<CreateModelData[]>;
        startStreamChat: (params: {
          tabId: string;
          threadId: string;
          userMessageId: string;
          messages: Array<{
            role: "user" | "assistant" | "system" | "function";
            content: string;
            attachments?: string | null;
          }>;
          provider: Provider;
          modelName: string;
        }) => Promise<{ success: boolean; error?: string }>;
        reGenerateStreamChat: (params: {
          tabId: string;
          threadId: string;
          userMessageId: string;
          messages: Array<{
            role: "user" | "assistant" | "system" | "function";
            content: string;
            attachments?: string | null;
          }>;
          provider: Provider;
          modelName: string;
          regenerateMessageId: string;
        }) => Promise<{ success: boolean; error?: string }>;
        stopStreamChat: (params: { tabId: string }) => Promise<{ success: boolean }>;
      };
      triplitService: {
        getServerStatus: () => Promise<{
          isRunning: boolean;
          config: {
            port: number;
            projectId: string;
            verboseLogs: boolean;
          };
        }>;
        restartServer: () => Promise<{
          success: boolean;
          message: string;
        }>;
      };
    };
  }
}
