import { createOpenAI } from "@ai-sdk/openai";
import type { Provider, UpdateProviderData } from "@shared/triplit/types";
import type { StreamTextResult, ToolSet } from "ai";
import type { StreamChatParams } from "../base-provider-service";
import { OpenAIProviderService } from "../openAI-provider-service";
import { ai302Fetcher } from "./302AI-fetcher";

export class AI302ProviderService extends OpenAIProviderService {
  constructor(provider: Provider) {
    super(provider);

    this.openai = createOpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      fetch: ai302Fetcher(),
    });
  }

  async checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    return await super.checkApiKey();
  }

  updateProvider(updateData: UpdateProviderData): void {
    this.provider = {
      ...this.provider,
      ...updateData,
    };

    this.openai = createOpenAI({
      apiKey: updateData.apiKey,
      baseURL: updateData.baseUrl,
      fetch: ai302Fetcher(),
    });
  }

  async startStreamChat(
    params: StreamChatParams,
    abortController: AbortController,
  ): Promise<StreamTextResult<ToolSet, never>> {
    return await super.startStreamChat(params, abortController);
  }
}
