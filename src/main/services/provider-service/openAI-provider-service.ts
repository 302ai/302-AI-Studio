import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { fetchOpenAIModels } from "@main/api/ai";
import { extractErrorMessage } from "@main/utils/error-utils";
import { convertMessagesToModelMessages } from "@main/utils/message-converter";

import { createReasoningFetch } from "@main/utils/reasoning";
import type {
  CreateModelData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";

// Import AI SDK types
import {
  type StreamTextResult,
  smoothStream,
  streamText,
  type ToolSet,
} from "ai";
import Logger from "electron-log";
import {
  BaseProviderService,
  type StreamChatParams,
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

      const modelIds = response.data.map((model) => model.id.trim()) || [];
      const formatedModels = modelIds.map((id) => {
        return {
          name: id,
          providerId: this.provider.id,
          custom: false,
          enabled: true,
          collected: false,
          capabilities: new Set(["vision", "file"]),
        };
      });

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
    const {
      tabId,
      threadId,
      userMessageId,
      messages,
      model: originModel,
    } = params;

    try {
      const model = this.openai(originModel.name);

      Logger.info(`Starting stream chat for tab ${tabId}, thread ${threadId}`);

      // Convert messages to ModelMessage format with attachment support
      const modelMessages = await convertMessagesToModelMessages(
        messages,
        userMessageId,
      );

      const result = streamText({
        model: model,
        messages: modelMessages,

        experimental_transform: smoothStream({
          chunking: "line",
          delayInMs: 20,
        }),
        abortSignal: abortController.signal,
      });

      return result;
    } catch (error) {
      Logger.error("Failed to start stream chat:", error);
      throw error;
    }
  }
}
