import type { ElectronAPI } from "@electron-toolkit/preload";
import type {
  CreateModelData,
  CreateProviderData,
  CreateThreadData,
  Provider,
  Thread,
  UpdateProviderData,
  UpdateThreadData,
} from "@shared/triplit/types";
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
        // * General settings
        getLanguage: () => Promise<LanguageVarious>;
        setLanguage: (language: LanguageVarious) => void;
        setTheme: (theme: ThemeMode) => void;

        // * Provider and models settings
        insertProvider: (provider: CreateProviderData) => Promise<Provider>;
        deleteProvider: (providerId: string) => Promise<void>;
        updateProvider: (
          providerId: string,
          updateData: UpdateProviderData,
        ) => Promise<void>;
        updateProviderOrder: (
          providerId: string,
          order: number,
        ) => Promise<void>;
        insertModels: (models: CreateModelData[]) => Promise<void>;
        getProviderModels: (providerId: string) => Promise<Model[]>;
      };
      threadService: {
        insertThread: (thread: CreateThreadData) => Promise<Thread>;
        deleteThread: (threadId: string) => Promise<void>;
        updateThread: (
          threadId: string,
          updateData: UpdateThreadData,
        ) => Promise<void>;
        getThreadById: (threadId: string) => Promise<Thread | null>;
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
        stopStreamChat: (params: {
          tabId: string;
        }) => Promise<{ success: boolean }>;
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
      filePreviewService: {
        previewImage: (
          fileName: string,
          base64Data: string,
        ) => Promise<{
          success: boolean;
          error?: string;
        }>;
        previewFile: (
          fileName: string,
          fileData: string,
          mimeType: string,
        ) => Promise<{
          success: boolean;
          error?: string;
        }>;
        cleanupAllTempFiles: () => void;
      };
    };
  }
}
