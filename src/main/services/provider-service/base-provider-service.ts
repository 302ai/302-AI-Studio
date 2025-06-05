import type { CreateModelData, Provider } from "@shared/triplit/types";
import Logger from "electron-log";

export abstract class BaseProviderService {
  protected provider: Provider;
  protected models: CreateModelData[] = [];

  constructor(provider: Provider) {
    this.provider = provider;
  }

  abstract checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }>;

  async fetchModels(): Promise<CreateModelData[]> {
    try {
      const models = await this.fetchProviderModels();
      this.models = models;
      Logger.debug(
        "Fetch models successfully:",
        this.provider.name,
        "model count:",
        models.length,
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

  protected abstract fetchProviderModels(): Promise<CreateModelData[]>;
}
