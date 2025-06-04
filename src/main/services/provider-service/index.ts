import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { ModelProvider } from "@shared/types/provider";
import Logger from "electron-log";
import { ConfigService } from "../config-service";
import { EventNames, emitter } from "../event-service";
import type { BaseProviderService } from "./base-provider-service";
import { OpenAIProviderService } from "./openAI-provider-service";

export type CheckApiKeyParams =
  | {
      condition: "add";
      providerCfg: ModelProvider;
    }
  | {
      condition: "edit";
      providerId: string;
      providerCfg: Pick<
        ModelProvider,
        "name" | "baseUrl" | "apiKey" | "apiType"
      >;
    };

@ServiceRegister("providerService")
export class ProviderService {
  private configService: ConfigService;
  private providerMap: Map<string, ModelProvider> = new Map();
  private providerInstMap: Map<string, BaseProviderService> = new Map();

  constructor() {
    this.configService = new ConfigService();
    this.init();

    // TODO: The current implementation is not efficient, we should use a more efficient way to update the provider service
    emitter.on(EventNames.PROVIDERS_UPDATE, () => {
      Logger.info("PROVIDERS_UPDATE");
      this.init();
    });
  }

  private init() {
    const providers = this.configService.getProviders();
    providers.forEach((provider) => {
      this.providerMap.set(provider.id, provider);

      if (provider.enabled) {
        const providerInst = this.createProviderInst(provider);
        if (providerInst) {
          this.providerInstMap.set(provider.id, providerInst);
          Logger.info("Provider initialized successfully:", provider.name);
        }
      }
    });
  }

  private createProviderInst(
    provider: ModelProvider
  ): BaseProviderService | undefined {
    switch (provider.apiType) {
      case "openai":
        return new OpenAIProviderService(provider);

      default:
        Logger.warn(`Unknown provider type: ${provider.apiType}`);
        return undefined;
    }
  }

  /**
   * Check API Key and if the condition is "add", set the models to the config service
   *
   * @param _event
   * @param params CheckApiKeyParams
   * @returns The status of the API key check, and the error message if the check fails, and the models if the check is successful (only on "add" condition)
   */
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async checkApiKey(
    _event: Electron.IpcMainEvent,
    params: CheckApiKeyParams
  ): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    if (params.condition === "add") {
      const providerInst = this.createProviderInst(params.providerCfg);
      if (!providerInst) {
        return { isOk: false, errorMsg: "Failed to create provider instance" };
      }

      const { isOk, errorMsg, models } = await providerInst.checkApiKey();
      if (isOk) {
        this.configService._setProviderModels(
          params.providerCfg.id,
          models || []
        );
      }

      Logger.debug("checkApiKey (add): ", params.providerCfg.name, {
        isOk,
        errorMsg,
        models: models?.length,
      });

      return { isOk, errorMsg };
    }

    if (params.condition === "edit") {
      try {
        const originalProvider = this.getProviderById(params.providerId);
        const tempProvider: ModelProvider = {
          ...originalProvider,
          ...params.providerCfg,
        };
        const tempProviderInst = this.createProviderInst(tempProvider);
        if (!tempProviderInst) {
          return {
            isOk: false,
            errorMsg: "Failed to create provider instance",
          };
        }

        const result = await tempProviderInst.checkApiKey();

        Logger.debug("checkApiKey (edit): ", tempProvider.name, {
          isOk: result.isOk,
          errorMsg: result.errorMsg,
          models: result.models?.length,
        });

        return result;
      } catch (error) {
        return {
          isOk: false,
          errorMsg: `Failed to get provider instance: ${error}`,
        };
      }
    }

    return { isOk: false, errorMsg: "Invalid condition" };
  }

  getProviderById(id: string): ModelProvider {
    const provider = this.providerMap.get(id);
    if (!provider) {
      throw new Error(`Provider ${id} not found`);
    }
    return provider;
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  updateProviderConfig(
    _event: Electron.IpcMainEvent,
    providerId: string,
    updates: Partial<ModelProvider>
  ): void {
    const provider = this.providerMap.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const updatedProvider = { ...provider, ...updates };
    this.providerMap.set(providerId, updatedProvider);

    this.configService.updateProvider(updatedProvider);

    if (updatedProvider.enabled) {
      const newInstance = this.createProviderInst(updatedProvider);
      if (newInstance) {
        this.providerInstMap.set(providerId, newInstance);
        Logger.info("Provider instance updated:", updatedProvider.name);
      }
    }
  }
}
