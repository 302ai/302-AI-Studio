import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { fetchOpenAIModels } from "@main/api/ai";
import { extractErrorMessage } from "@main/utils/error-utils";
import { detectModelProvider, parseModels } from "@main/utils/models";
import { createReasoningFetch } from "@main/utils/reasoning";
import logger from "@shared/logger/main-logger";
import type {
  CreateModelData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import {
  generateText,
  type ModelMessage,
  type StreamTextResult,
  type ToolSet,
} from "ai";
import {
  BaseProviderService,
  type StreamChatParams,
  type SummaryTitleParams,
} from "./base-provider-service";

export class OpenAIProviderService extends BaseProviderService {
  protected openai: OpenAIProvider;

  constructor(provider: Provider) {
    super(provider);

    this.openai = createOpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      fetch: createReasoningFetch(),
    });
  }

  async checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }> {
    try {
      await this.fetchProviderModels();
      return {
        isOk: true,
        errorMsg: null,
      };
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);

      return {
        isOk: false,
        errorMsg: errorMessage,
      };
    }
  }

  updateProvider(updateData: UpdateProviderData): void {
    this.provider = {
      ...this.provider,
      ...updateData,
    };

    this.openai = createOpenAI({
      apiKey: updateData.apiKey,
      baseURL: updateData.baseUrl,
      fetch: createReasoningFetch(),
    });
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
            capabilities,
            type: "language" as const,
          };
        }) || [];

      logger.info("Fetched OpenAI models successfully, the count is:", {
        count: formatedModels.length,
      });

      return formatedModels;
    } catch (error) {
      logger.error("Failed to fetch OpenAI models:", { error });

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(extractErrorMessage(error));
    }
  }

  async startStreamChat(
    params: StreamChatParams,
    abortController: AbortController,
  ): Promise<StreamTextResult<ToolSet, never>> {
    const { messages, model: originModel } = params;

    try {
      const model = this.openai(originModel.name);

      const isClaude = detectModelProvider(originModel.name) === "anthropic";
      logger.info("Starting stream chat", {
        tabId: params.tabId,
        threadId: params.threadId,
      });

      if (isClaude) {
        this.openai = createOpenAI({
          apiKey: this.provider.apiKey,
          baseURL: this.provider.baseUrl,
          fetch: createReasoningFetch(isClaude),
        });
      }

      const result = await this._startStreamChat(
        params,
        abortController,
        model,
        messages as ModelMessage[],
      );

      return result;
    } catch (error) {
      logger.error("Failed to start stream chat:", { error });
      throw error;
    }
  }

  async summaryTitle(params: SummaryTitleParams): Promise<{
    text: string;
  }> {
    const { messages, model: originModel } = params;

    try {
      const model = this.openai(originModel.name);

      const conversationText = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");
      const prompt = `You need to summarize the user's conversation into a title of no more than 10 words, with the title language matching the user's primary language, without using punctuation or other special symbols`;
      const result = await generateText({
        model: model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: conversationText },
        ],
      });

      return {
        text: result.text,
      };
    } catch (error) {
      logger.error("Failed to generate text:", { error });
      throw error;
    }
  }
}
