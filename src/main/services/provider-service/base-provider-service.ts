/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */

import { isSupportedModel } from "@main/utils/models";
import logger from "@shared/logger/main-logger";
import type {
  CreateModelData,
  Model,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import {
  type LanguageModel,
  type ModelMessage,
  type StreamTextResult,
  smoothStream,
  streamText,
  type ToolSet,
} from "ai";

import {
  cleanupAbortController as cleanupAbortControllerForTab,
  createAbortController as createAbortControllerForTab,
} from "./stream-manager";

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  id?: string; // Add message ID to support attachment lookup
}

export interface StreamChatParams {
  tabId: string;
  threadId: string;
  userMessageId: string;
  messages: ChatMessage[];
  model: Model;
  provider: Provider;
}

export interface SummaryTitleParams {
  messages: ChatMessage[];
  model: { id: string; name: string };
  provider: Provider;
}

export abstract class BaseProviderService {
  protected provider: Provider;
  protected models: CreateModelData[] = [];

  constructor(provider: Provider) {
    this.provider = provider;
  }

  // Helper to create and store an AbortController
  protected createAbortController(tabId: string): AbortController {
    return createAbortControllerForTab(tabId);
  }

  // Helper to clean up the AbortController after the stream is done
  protected cleanupAbortController(tabId: string) {
    cleanupAbortControllerForTab(tabId);
  }

  abstract checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }>;

  abstract updateProvider(updateData: UpdateProviderData): void;

  async fetchModels(): Promise<CreateModelData[]> {
    try {
      const models = await this.fetchProviderModels();
      const supportedModels = models.filter((model) => isSupportedModel(model));
      this.models = supportedModels;
      logger.debug("Fetch models successfully", {
        providerName: this.provider.name,
        supportedModelsCount: supportedModels.length,
      });

      return supportedModels;
    } catch (error) {
      logger.error("Failed to fetch models:", { error });
      if (!this.models) {
        this.models = [];
      }
      return [];
    }
  }

  protected abstract fetchProviderModels(): Promise<CreateModelData[]>;

  // Abstract method for streaming chat - to be implemented by each provider
  abstract startStreamChat(
    params: StreamChatParams,
    abortController: AbortController,
  ): Promise<StreamTextResult<ToolSet, never>>;

  protected async _startStreamChat(
    params: StreamChatParams,
    abortController: AbortController,
    languageModel: LanguageModel,
    modelMessages: ModelMessage[],
  ): Promise<StreamTextResult<ToolSet, never>> {
    const { tabId, threadId } = params;

    try {
      logger.info(`Starting stream chat for tab ${tabId}, thread ${threadId}`);

      const result = streamText({
        model: languageModel,
        messages: modelMessages,

        experimental_transform: smoothStream({
          chunking: "line",
        }),
        abortSignal: abortController.signal,
      });

      return result;
    } catch (error) {
      logger.error("Failed to start stream chat:", { error });
      throw error;
    }
  }

  abstract summaryTitle(params: SummaryTitleParams): Promise<{
    text: string;
  }>;
}
