import { createOpenAI } from "@ai-sdk/openai";
import type { Provider, UpdateProviderData } from "@shared/triplit/types";
import type { StreamTextResult, ToolSet } from "ai";
import type { SettingsService } from "../../settings-service";
import type {
  StreamChatParams,
  SummaryTitleParams,
} from "../base-provider-service";
import { OpenAIProviderService } from "../openAI-provider-service";
import { ai302Fetcher } from "./302AI-fetcher";

export class AI302ProviderService extends OpenAIProviderService {
  constructor(
    provider: Provider,
    private settingsService: SettingsService,
  ) {
    super(provider);
    this.initializeOpenAI(provider);
  }

  private async getSettings() {
    const enableReason = await this.settingsService.getEnableReason();
    const webSearchConfig = await this.settingsService.getWebSearchConfig();
    return { enableReason, webSearchConfig };
  }

  private async initializeOpenAI(provider: Provider) {
    const { enableReason, webSearchConfig } = await this.getSettings();
    this.openai = createOpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      fetch: ai302Fetcher(enableReason, webSearchConfig),
    });
  }

  async checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    return await super.checkApiKey();
  }

  async updateProvider(updateData: UpdateProviderData): Promise<void> {
    this.provider = {
      ...this.provider,
      ...updateData,
    };

    const { enableReason, webSearchConfig } = await this.getSettings();
    this.openai = createOpenAI({
      apiKey: updateData.apiKey,
      baseURL: updateData.baseUrl,
      fetch: ai302Fetcher(enableReason, webSearchConfig),
    });
  }

  async startStreamChat(
    params: StreamChatParams,
    abortController: AbortController,
  ): Promise<StreamTextResult<ToolSet, never>> {
    const { enableReason, webSearchConfig } = await this.getSettings();
    this.openai = createOpenAI({
      apiKey: this.provider.apiKey,
      baseURL: this.provider.baseUrl,
      fetch: ai302Fetcher(enableReason, webSearchConfig),
    });

    return await super.startStreamChat(params, abortController);
  }

  async summaryTitle(params: SummaryTitleParams): Promise<{
    text: string;
  }> {
    this.openai = createOpenAI({
      apiKey: this.provider.apiKey,
      baseURL: this.provider.baseUrl,
      fetch: ai302Fetcher(false, { enabled: false }),
    });

    return await super.summaryTitle(params);
  }
}
