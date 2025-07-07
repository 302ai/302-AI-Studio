import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { fetchOpenAIModels } from "@main/api/ai";
import { extractErrorMessage } from "@main/utils/error-utils";
import { createReasoningFetch } from "@main/utils/reasoning";
import type {
  CreateModelData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
// Import AI SDK types
import {
  generateText,
  type ModelMessage,
  type StreamTextResult,
  smoothStream,
  streamText,
  type ToolSet,
} from "ai";
import Logger from "electron-log";
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
          return {
            name: model.id.trim(),
            providerId: this.provider.id,
            custom: false,
            enabled: true,
            collected: false,
            capabilities: new Set(model.is_moderated ? ["vision", "file"] : []),
          };
        }) || [];

      Logger.info(
        "Fetched OpenAI models successfully, the count is:",
        formatedModels.length,
      );

      return formatedModels;
    } catch (error) {
      Logger.error("Failed to fetch OpenAI models:", error);

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
    const { tabId, threadId, messages, model: originModel } = params;

    try {
      const model = this.openai(originModel.name);

      Logger.info(`Starting stream chat for tab ${tabId}, thread ${threadId}`);

      const result = streamText({
        model: model,
        messages: messages as ModelMessage[],

        experimental_transform: smoothStream({
          chunking: "line",
        }),
        abortSignal: abortController.signal,
      });

      return result;
    } catch (error) {
      Logger.error("Failed to start stream chat:", error);
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
      Logger.error("Failed to generate text:", error);
      throw error;
    }
  }
}
