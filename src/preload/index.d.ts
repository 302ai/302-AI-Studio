import type { ElectronAPI } from "@electron-toolkit/preload";
import type { StreamChatParams } from "@main/services/provider-service/base-provider-service";
import type { UpdaterStatus } from "@main/services/updater-service";
import type {
  Attachment,
  CreateAttachmentData,
  CreateMessageData,
  CreateModelData,
  CreateProviderData,
  CreateTabData,
  CreateThreadData,
  Language,
  Message,
  Provider,
  SearchService,
  ShortcutAction,
  ShortcutScope,
  Tab,
  Theme,
  Thread,
  UpdateAttachmentData,
  UpdateMessageData,
  UpdateProviderData,
  UpdateTabData,
  UpdateThreadData,
} from "@shared/triplit/types";
import type { Model } from "@shared/types/model";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      platform: string;
      webUtils: {
        getPathForFile: (file: File) => string;
      };
    };
    service: {
      configService: {
        // * General settings
        getAppLanguage: () => Promise<Language>;
        setAppLanguage: (language: Language) => Promise<void>;
        setSearchService: (searchService: SearchService) => Promise<void>;
        setAppTheme: (theme: Theme) => Promise<void>;
        updateAppTheme: (theme: Theme) => Promise<void>;

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
        updateProviderModels: (
          providerId: string,
          models: CreateModelData[],
        ) => Promise<void>;
      };
      threadService: {
        insertThread: (thread: CreateThreadData) => Promise<Thread>;
        deleteThread: (threadId: string) => Promise<void>;
        updateThread: (
          threadId: string,
          updateData: UpdateThreadData,
        ) => Promise<void>;
        getThreadById: (threadId: string) => Promise<Thread | null>;
        deleteAllThreads: () => Promise<string[]>;
      };
      tabService: {
        insertTab: (tab: CreateTabData) => Promise<Tab>;
        deleteTab: (tabId: string) => Promise<string>;
        deleteAllTabs: () => Promise<void>;
        updateTab: (tabId: string, updateData: UpdateTabData) => Promise<void>;
        getTab: (tabId: string) => Promise<Tab | null>;
        moveTab: (
          fromIndex: number,
          toIndex: number,
          tabs: Tab[],
        ) => Promise<void>;
        // activateTab: (tabId: string) => Promise<void>;
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
          threadId: string;
        }) => Promise<{ success: boolean }>;
        summaryTitle: (params: {
          messages: { role: string; content: string; id?: string }[];
          provider: Provider;
          model: { id: string; name: string };
        }) => Promise<{
          success: boolean;
          text?: string;
          error?: string;
        }>;
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
        updateSidebarCollapsed: (collapsed: boolean) => Promise<void>;
        getSidebarCollapsed: () => Promise<boolean>;
      };
      messageService: {
        insertMessage: (message: CreateMessageData) => Promise<Message>;
        updateMessage: (
          messageId: string,
          updateData: UpdateMessageData,
        ) => Promise<void>;
        deleteMessage: (messageId: string, threadId: string) => Promise<void>;
        getMessagesByThreadId: (threadId: string) => Promise<Message[]>;
        getMessageById: (messageId: string) => Promise<Message | null>;
        deleteMessagesByThreadId: (threadId: string) => Promise<void>;
        deleteAllMessages: (threadIds?: string[]) => Promise<void>;
        editMessage: (
          messageId: string,
          editData: {
            threadId: string;
          } & Pick<Message, "content">,
        ) => Promise<void>;
        insertMessages: (messages: CreateMessageData[]) => Promise<void>;
      };
      attachmentService: {
        insertAttachments: (
          attachments: CreateAttachmentData[],
        ) => Promise<void>;
        updateAttachment: (
          attachmentId: string,
          updateData: UpdateAttachmentData,
        ) => Promise<void>;
        getAttachmentsByMessageId: (messageId: string) => Promise<Attachment[]>;
        deleteAttachmentsByMessageId: (messageId: string) => Promise<void>;
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
      filePreviewService: {
        previewImage: (
          fileName: string,
          base64Data: string,
        ) => Promise<{
          success: boolean;
          error?: string;
        }>;
        previewFileByPath: (filePath: string) => Promise<{
          success: boolean;
          error?: string;
        }>;
      };
      fileParseService: {
        parseFileContent: (attachment: {
          id: string;
          name: string;
          type: string;
          fileData: string;
        }) => Promise<string>;
        shouldParseFile: (type: string) => Promise<boolean>;
      };
      chatService: {
        getMessagesByThreadId: (threadId: string) => Promise<Message[]>;
      };
      shellService: {
        openExternal: (url: string) => Promise<void>;
      };
      settingsService: {
        setEnableWebSearch: (enable: boolean) => Promise<void>;
        setEnableDefaultPrivacyMode: (enable: boolean) => Promise<void>;
        setEnablePrivate: (enable: boolean) => Promise<void>;
        setEnableReason: (enable: boolean) => Promise<void>;
        setsearchService: (searchService: SearchService) => Promise<void>;
        updateSelectedModelId: (modelId: string) => Promise<void>;
        setDisplayAppStore: (displayAppStore: boolean) => Promise<void>;
      };
      shortcutsService: {
        initializeGlobalShortcuts: () => Promise<void>;
        updateShortcut: (
          action: ShortcutAction,
          keys: string[],
          scope?: ShortcutScope,
        ) => Promise<void>;
        getShortcuts: () => Promise<
          Array<{
            action: ShortcutAction;
            keys: string[];
            accelerator: string;
            scope: ShortcutScope;
          }>
        >;
      };
      modelService: {
        insertModel: (
          providerId: string,
          model: CreateModelData,
        ) => Promise<Model>;
        updateModel: (
          modelId: string,
          updateData: UpdateModelData,
        ) => Promise<Model>;
        deleteModel: (modelId: string) => Promise<void>;
        clearModel: (providerId: string) => Promise<void>;
        collectModel: (modelId: string, collected: boolean) => Promise<void>;
      };
      updaterService: {
        setAutoUpdate: (autoUpdate: boolean) => Promise<void>;
        checkForUpdates: () => Promise<void>;
        getStatus: () => Promise<UpdaterStatus>;
        update: () => Promise<void>;
        install: () => Promise<void>;
      };
      toolboxService: {
        getToolUrl: (toolId: number) => Promise<string>;
      };
    };
  }
}
