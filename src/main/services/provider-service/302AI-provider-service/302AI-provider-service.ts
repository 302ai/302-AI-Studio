import { fetchOpenAIModels } from "@main/api/ai";
import { extractErrorMessage } from "@main/utils/error-utils";
import {
  type ChatMessage,
  convertMessagesToModelMessages,
} from "@main/utils/message-converter";
import { detectModelProvider, parseModels } from "@main/utils/models";
import logger from "@shared/logger/main-logger";
import type {
  CreateModelData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import OpenAI from "openai";
import type { SettingsService } from "../../settings-service";
import type {
  OpenAIStreamResponse,
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
    this.openai = new OpenAI({
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
    this.openai = new OpenAI({
      apiKey: updateData.apiKey,
      baseURL: updateData.baseUrl,
      fetch: ai302Fetcher(enableReason, webSearchConfig, false, false),
    });
  }

  async startStreamChat(
    params: StreamChatParams,
    abortController: AbortController,
  ): Promise<OpenAIStreamResponse> {
    const { enableReason, webSearchConfig } = await this.getSettings();
    const { messages, model } = params;
    const modelMessages = await convertMessagesToModelMessages(
      messages,
      params.userMessageId,
    );

    let enableVision = false;
    let newMessages = modelMessages;
    const lastMessage = newMessages[modelMessages.length - 1];

    if (!model.capabilities.has("vision")) {
      enableVision =
        Array.isArray(lastMessage.content) &&
        lastMessage.content.some(
          (item: { type: string }) => item.type === "image_url",
        );
      if (enableVision) {
        newMessages = newMessages.filter((item) => {
          if (Array.isArray(item?.content)) {
            return !item?.content.some((item) => item.type === "image_url");
          }
          return true;
        });
        newMessages.push(lastMessage);
      }
    }

    // * Enable reasoning for non-reasoning models
    const canReason = !model.capabilities.has("reasoning") && enableReason;
    const isClaude = detectModelProvider(model.name) === "anthropic";

    this.openai = new OpenAI({
      apiKey: this.provider.apiKey,
      baseURL: this.provider.baseUrl,
      fetch: ai302Fetcher(canReason, webSearchConfig, enableVision, isClaude),
    });

    return await this._startStreamChat(
      { ...params, messages: newMessages as ChatMessage[] },
      abortController,
      this.openai,
      newMessages,
      model.name,
    );
  }

  protected async fetchProviderModels(options?: {
    timeout: number;
  }): Promise<CreateModelData[]> {
    try {
      const response = await fetchOpenAIModels({
        apiKey: this.provider.apiKey,
        baseUrl: this.provider.baseUrl,
        timeout: options?.timeout,
      });
      const formatedModels =
        response.data.map((model) => {
          const capabilities = parseModels(model.id);
          return {
            name: model.id.trim(),
            remark: model.id.trim(),
            providerId: this.provider.id,
            custom: false,
            enabled: true,
            collected: false,
            capabilities: new Set(
              model.is_moderated
                ? ["vision", "file", ...capabilities]
                : capabilities,
            ),
            type: "language" as const,
          };
        }) || [];

      return formatedModels;
    } catch (error) {
      logger.error("Failed to fetch 302.AI models:", { error });

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(extractErrorMessage(error));
    }
  }

  async summaryTitle(params: SummaryTitleParams): Promise<{
    isOk: boolean;
    errorMsg: string | null;
    text: string;
  }> {
    this.openai = new OpenAI({
      apiKey: this.provider.apiKey,
      baseURL: this.provider.baseUrl,
      fetch: ai302Fetcher(false, { enabled: false }),
    });

    const result = await super.summaryTitle(params);
    return {
      isOk: result.isOk,
      errorMsg: result.errorMsg,
      text: result.text,
    };
  }
}
