import type { ElectronAPI } from "@electron-toolkit/preload";
import type { StreamChatParams } from "@main/services/provider-service/base-provider-service";
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
        deleteAllThreads: () => Promise<void>;
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
        startStreamChat: (
          params: StreamChatParams,
        ) => Promise<{ success: boolean; error?: string }>;
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
        deleteMessagesByThreadId: (threadId: string) => Promise<void>;
        deleteAllMessages: () => Promise<void>;
        editMessage: (
          messageId: string,
          editData: {
            threadId: string;
          } & Pick<Message, "content" | "attachments">,
        ) => Promise<void>;
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
        parseFileContent: (
          attachment: {
            id: string;
            name: string;
            type: string;
            fileData: string;
          },
          options: {
            apiKey: string;
            baseUrl: string;
          },
        ) => Promise<string>;
        shouldParseFile: (type: string) => boolean;
      };
      chatService: {
        getMessagesByThreadId: (threadId: string) => Promise<Message[]>;
      };
    };
  }
}
