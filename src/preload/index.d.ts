import type { ElectronAPI } from "@electron-toolkit/preload";
import type { CheckApiKeyParams } from "@main/services/provider-service";
import type {
  CreateModelData,
  CreateProviderData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import type { Model } from "@shared/types/model";
import type { ModelProvider } from "@shared/types/provider";
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
        // setProviders: (providers: ModelProvider[]) => void;
        getProviderModels: (providerId: string) => Promise<Model[]>;
        setProviderModels: (providerId: string, models: Model[]) => void;
        // getModelSettings: () => Promise<ModelSettingData>;

        addProvider: (provider: CreateProviderData) => Promise<Provider>;
        deleteProvider: (providerId: string) => Promise<void>;
        updateProvider: (
          providerId: string,
          provider: UpdateProviderData,
        ) => Promise<void>;
        addModels: (models: CreateModelData[]) => Promise<void>;
      };
      threadsService: {
        setActiveThreadId: (threadId: string) => void;
      };
      providerService: {
        checkApiKey: (params: CheckApiKeyParams) => Promise<{
          isOk: boolean;
          errorMsg: string | null;
        }>;
        updateProviderConfig: (
          providerId: string,
          updates: Partial<ModelProvider>,
        ) => void;

        fetchModels: (provider: Provider) => Promise<CreateModelData[]>;
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
