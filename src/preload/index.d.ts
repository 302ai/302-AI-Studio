import type { ElectronAPI } from "@electron-toolkit/preload";
import type {
  CreateMessageData,
  CreateModelData,
  CreateProviderData,
  CreateTabData,
  CreateThreadData,
  Message,
  Provider,
  Tab,
  Thread,
  UpdateMessageData,
  UpdateProviderData,
  UpdateTabData,
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
      tabService: {
        insertTab: (tab: CreateTabData) => Promise<Tab>;
        deleteTab: (tabId: string) => Promise<string>;
        updateTab: (tabId: string, updateData: UpdateTabData) => Promise<void>;
        getTab: (tabId: string) => Promise<Tab | null>;
        moveTab: (
          fromIndex: number,
          toIndex: number,
          tabs: Tab[],
        ) => Promise<void>;
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
      uiService: {
        updateActiveProviderId: (providerId: string) => Promise<void>;
        getActiveProviderId: () => Promise<string>;
        clearActiveProviderId: () => Promise<void>;
        getActiveProvider: () => Promise<Provider | null>;
        updateActiveThreadId: (threadId: string) => Promise<void>;
        getActiveThreadId: () => Promise<string>;
        clearActiveThreadId: () => Promise<void>;
        getActiveThread: () => Promise<Thread | null>;
        getActiveTabId: () => Promise<string>;
        clearActiveTabId: () => Promise<void>;
        updateActiveTabHistory: (tabId: string) => Promise<void>;
        updateActiveTabId: (tabId: string) => Promise<void>;
      };
      messageService: {
        insertMessage: (message: CreateMessageData) => Promise<Message>;
        updateMessage: (
          messageId: string,
          updateData: UpdateMessageData,
        ) => Promise<void>;
        deleteMessage: (messageId: string) => Promise<void>;
        getMessagesByThreadId: (threadId: string) => Promise<Message[]>;
        getMessageById: (messageId: string) => Promise<Message | null>;
        cleanMessagesByThreadId: (threadId: string) => Promise<void>;
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
        getServerPort: () => Promise<number>;
      };
      fileService: {
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
      fileParseService: {
        getMimeType: (filePath: string) => Promise<string>;
        prepareFile: (
          absPath: string,
          typeInfo?: string,
        ) => Promise<{
          name: string;
          content: string;
          mimeType: string;
          metadata: {
            fileName: string;
            fileSize: number;
            fileDescription?: string;
            fileCreated: Date;
            fileModified: Date;
          };
          token: number;
          path: string;
          thumbnail?: string;
        }>;
        prepareDirectory: (absPath: string) => Promise<{
          name: string;
          content: string;
          mimeType: string;
          metadata: {
            fileName: string;
            fileSize: number;
            fileDescription?: string;
            fileCreated: Date;
            fileModified: Date;
          };
          token: number;
          path: string;
          thumbnail?: string;
        }>;
        writeTemp: (file: {
          name: string;
          content: string | Buffer | ArrayBuffer;
        }) => Promise<string>;
        writeImageBase64: (file: {
          name: string;
          content: string;
        }) => Promise<string>;
        isDirectory: (absPath: string) => Promise<boolean>;
        readFile: (relativePath: string) => Promise<string>;
        writeFile: (operation: {
          path: string;
          content?: string;
        }) => Promise<void>;
        deleteFile: (relativePath: string) => Promise<void>;
        parseFileContent: (attachment: {
          id: string;
          name: string;
          type: string;
          fileData: string;
        }) => Promise<string>;
        shouldParseFile: (type: string) => Promise<boolean>;
      };
    };
  }
}
