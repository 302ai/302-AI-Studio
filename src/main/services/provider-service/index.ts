import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { ModelProvider } from "@renderer/types/providers";
import { ConfigService } from "../config-service";
import type { BaseProviderService } from "./base-provider-service";
import { OpenAICompatibleProviderService } from "./openAI-compatible-provider-service";

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

      if (provider.enable) {
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
      case "openai-compatible":
        return new OpenAICompatibleProviderService(provider);

      default:
        console.warn(`Unknown provider type: ${provider.apiType}`);
        return undefined;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async checkApiKey(
    condition: "add" | "edit",
    providerId?: string,
    tempConfig?: {
      apiKey: string;
      baseURL: string;
      providerType: string;
      providerName?: string;
    }
  ): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    let providerInst: BaseProviderService | undefined;

    if (condition === "edit") {
      if (!providerId) {
        return {
          isOk: false,
          errorMsg: "Provider ID is required for edit mode",
        };
      }
      providerInst = this.getProviderInst(providerId);
    } else {
      // condition === "add"
      if (!tempConfig) {
        return {
          isOk: false,
          errorMsg: "Temporary config is required for add mode",
        };
      }

      const tempProvider: ModelProvider = {
        id: `temp_${Date.now()}`,
        name: tempConfig.providerName || "Temporary Provider",
        apiType: tempConfig.providerType,
        apiKey: tempConfig.apiKey,
        baseUrl: tempConfig.baseURL,
        enable: false,
        custom: true,
      };

      providerInst = this.createProviderInst(tempProvider);
      if (!providerInst) {
        return {
          isOk: false,
          errorMsg: `Failed to create provider instance for type: ${tempConfig.providerType}`,
        };
      }
    }

    return providerInst.checkApiKey();
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
