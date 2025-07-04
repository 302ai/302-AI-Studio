import { createOpenAI } from "@ai-sdk/openai";
import {
  type ChatMessage,
  convertMessagesToModelMessages,
} from "@main/utils/message-converter";
import type { Provider, UpdateProviderData } from "@shared/triplit/types";
import type { StreamTextResult, ToolSet } from "ai";
import Logger from "electron-log";
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
          (item: { type: string }) => item.type === "image",
        );
      if (enableVision) {
        newMessages = newMessages.filter((item) => {
          if (Array.isArray(item?.content)) {
            return !item?.content.some((item) => item.type === "image");
          }
          return true;
        });
        newMessages.push(lastMessage);
      } else {
        newMessages = newMessages.filter((item) => {
          if (Array.isArray(item?.content)) {
            Logger.info("item?.content:::", item?.content);
            return !item?.content.some((item) => item.type === "image");
          }
          return true;
        });
        enableVision = false;
      }
    }

    this.openai = createOpenAI({
      apiKey: this.provider.apiKey,
      baseURL: this.provider.baseUrl,
      fetch: ai302Fetcher(enableReason, webSearchConfig, enableVision),
    });

    return await super.startStreamChat(
      { ...params, messages: newMessages as ChatMessage[] },
      abortController,
    );
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
