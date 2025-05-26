import type { Model } from "@renderer/types/models";
import type { ModelProvider } from "@renderer/types/providers";
import OpenAI from "openai";
import { BaseProviderService } from "./base-provider-service";

export class OpenAIProviderService extends BaseProviderService {
  protected openai: OpenAI;

  constructor(provider: ModelProvider) {
    super(provider);
    this.openai = new OpenAI({
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
      const models = await this.fetchOpenAIModels();
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
    return this.fetchOpenAIModels(options);
  }

  protected async fetchOpenAIModels(options?: {
    timeout: number;
  }): Promise<Model[]> {
    const response = await this.openai.models.list(options);
    const models = response.data || [];
    models.forEach((model) => {
      model.id = model.id.trim();
    });
    const formatedModels = models.map((model) => {
      return {
        id: model.id,
        name: model.id,
        providerId: this.provider.id,
        custom: false,
        enabled: true,
      };
    });
    return formatedModels;
  }
}
