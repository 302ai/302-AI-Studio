import type { Model } from "@shared/types/model";
import type { ModelProvider } from "@shared/types/provider";
import Logger from "electron-log";
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
      this.configService._setProviderModels(this.provider.id, models);
      Logger.debug(
        "Fetch models successfully:",
        this.provider.name,
        "model count:",
        models.length
      );

      return models;
    } catch (error) {
      Logger.error("Failed to fetch models:", error);
      if (!this.models) {
        this.models = [];
      }
      return [];
    }
  }

  protected abstract fetchProviderModels(): Promise<Model[]>;
}
