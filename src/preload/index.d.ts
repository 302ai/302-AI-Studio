import type { ElectronAPI } from "@electron-toolkit/preload";
import type { ModelSettingData } from "@main/services/config-service";
import type { CheckApiKeyParams } from "@main/services/provider-service";
import type { Model } from "@shared/types/model";
import type { ModelProvider } from "@shared/types/provider";
import type { LanguageVarious, ThemeMode } from "@shared/types/settings";
import type { ThreadItem } from "@shared/types/thread";

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
        setProviders: (providers: ModelProvider[]) => void;
        getProviderModels: (providerId: string) => Promise<Model[]>;
        setProviderModels: (providerId: string, models: Model[]) => void;
        getModelSettings: () => Promise<ModelSettingData>;
      };
      threadsService: {
        setActiveThreadId: (threadId: string) => void;
        createThread: (threadData: ThreadItem) => Promise<{
          success: boolean;
          threadId?: string;
          error?: string;
        }>;
        updateThread: (
          threadId: string,
          data: Partial<ThreadItem>
        ) => Promise<{
          success: boolean;
          thread?: ThreadItem;
          error?: string;
        }>;
        deleteThread: (threadId: string) => void;
        getThreads: () => Promise<ThreadItem[]>;
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
