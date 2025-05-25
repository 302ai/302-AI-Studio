import type { Model } from "@renderer/types/models";
import type { ModelProvider } from "@renderer/types/providers";
import { ConfigService } from "../config-service";

export abstract class BaseProviderService {
  protected provider: ModelProvider;
  protected models: Model[] = [];
  protected configService: ConfigService;

  constructor(provider: ModelProvider) {
    this.provider = provider;
    this.configService = new ConfigService();
  }

  abstract checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
    models?: Model[];
  }>;

  async fetchModels(): Promise<Model[]> {
    try {
      const models = await this.fetchProviderModels();
      this.models = models;
      this.configService.setProviderModels(this.provider.id, models);

      return models;
    } catch (error) {
      console.error("Failed to fetch models:", error);
      if (!this.models) {
        this.models = [];
      }
      return [];
    }
  }

  protected abstract fetchProviderModels(): Promise<Model[]>;
}
