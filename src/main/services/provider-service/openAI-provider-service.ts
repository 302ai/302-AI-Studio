import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { fetchOpenAIModels } from "@shared/api/ai";
import type { Model } from "@shared/types/model";
import type { ModelProvider } from "@shared/types/provider";
import Logger from "electron-log";
import { BaseProviderService } from "./base-provider-service";

export class OpenAIProviderService extends BaseProviderService {
  protected openai: OpenAIProvider;

  constructor(provider: ModelProvider) {
    super(provider);
    this.openai = createOpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    });
  }

  async checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
    models?: Model[];
  }> {
    try {
      const models = await this.fetchProviderModels();
      return {
        isOk: true,
        errorMsg: null,
        models,
      };
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred during provider check.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      return {
        isOk: false,
        errorMsg: errorMessage,
      };
    }
  }

  protected async fetchProviderModels(options?: {
    timeout: number;
  }): Promise<Model[]> {
    try {
      const response = await fetchOpenAIModels({
        apiKey: this.provider.apiKey,
        baseUrl: this.provider.baseUrl,
        timeout: options?.timeout,
      });

      const modelIds = response.data.map((model) => model.id.trim()) || [];
      const formatedModels = modelIds.map((id) => {
        return {
          id,
          name: id,
          providerId: this.provider.id,
          custom: false,
          enabled: true,
          collected: false,
        };
      });

      Logger.info(
        "Fetched OpenAI models successfully, the count is:",
        formatedModels.length
      );

      return formatedModels;
    } catch (error) {
      Logger.error("Failed to fetch OpenAI models:", error);

      throw error;
    }
  }
}
