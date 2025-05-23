import { isSupportedModel } from "@renderer/config/models";
import type { ModelProvider } from "@renderer/types/providers";
import OpenAI from "openai";
import { BaseProviderService } from "./base-provider-service";

export class OpenAICompatibleProviderService extends BaseProviderService {
  protected openai: OpenAI;

  constructor(provider: ModelProvider) {
    super(provider);
    this.openai = new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    });
  }

  public async checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    try {
      await this.fetchOpenAIModels();
      return {
        isOk: true,
        errorMsg: null,
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

  protected async fetchOpenAIModels(options?: {
    timeout: number;
  }): Promise<OpenAI.Models.Model[]> {
    const response = await this.openai.models.list(options);
    const models = response.data || [];
    models.forEach((model) => {
      model.id = model.id.trim();
    });
    return models.filter(isSupportedModel);
  }
}
