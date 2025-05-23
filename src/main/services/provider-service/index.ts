import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import type { ModelProvider } from "@/src/renderer/types/providers";
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
    switch (provider.type) {
      case "openai-compatible":
        return new OpenAICompatibleProviderService(provider);

      default:
        console.warn(`Unknown provider type: ${provider.type}`);
        return undefined;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async checkApiKey(providerId: string): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    const providerInst = this.getProviderInst(providerId);
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
