import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { ModelProvider } from "@renderer/types/providers";
import { ConfigService } from "../config-service";
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
    };

@ServiceRegister("providerService")
export class ProviderService {
  private configService: ConfigService;
  private providerMap: Map<string, ModelProvider> = new Map();
  private providerInstMap: Map<string, BaseProviderService> = new Map();

  constructor() {
    this.configService = new ConfigService();
    this.init();
  }

  private init() {
    const providers = this.configService.getProviders();
    providers.forEach((provider) => {
      this.providerMap.set(provider.id, provider);

      if (provider.enabled) {
        const providerInst = this.createProviderInst(provider);
        if (providerInst) {
          this.providerInstMap.set(provider.id, providerInst);
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
        console.warn(`Unknown provider type: ${provider.apiType}`);
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
        this.configService.setProviderModels(
          params.providerCfg.id,
          models || []
        );
      }

      return { isOk, errorMsg };
    }

    if (params.condition === "edit") {
      try {
        const providerInst = this.getProviderInst(params.providerId);
        return providerInst.checkApiKey();
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

  private getProviderInst(providerId: string): BaseProviderService {
    let instance = this.providerInstMap.get(providerId);
    if (!instance) {
      const provider = this.getProviderById(providerId);
      instance = this.createProviderInst(provider);
      if (!instance) {
        throw new Error(`Failed to create provider instance for ${providerId}`);
      }
      this.providerInstMap.set(providerId, instance);
    }
    return instance;
  }
}
