import type { Provider, UpdateProviderData } from "@shared/triplit/types";
import type { StreamTextResult, ToolSet } from "ai";
import type { StreamChatParams } from "./base-provider-service";
import { OpenAIProviderService } from "./openAI-provider-service";

export class AI302ProviderService extends OpenAIProviderService {
  protected ai302: Provider;

  constructor(provider: Provider) {
    super(provider);

    this.ai302 = provider;
  }

  async checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    return await super.checkApiKey();
  }

  updateProvider(updateData: UpdateProviderData): void {
    super.updateProvider(updateData);

    this.ai302 = {
      ...this.ai302,
      ...updateData,
    };
  }

  async startStreamChat(
    params: StreamChatParams,
    abortController: AbortController,
  ): Promise<StreamTextResult<ToolSet, never>> {
    return await super.startStreamChat(params, abortController);
  }
}
