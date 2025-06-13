import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { fetchOpenAIModels } from "@main/api/ai";
import { extractErrorMessage } from "@main/utils/error-utils";
import { convertMessagesToModelMessages } from "@main/utils/message-converter";
import type { CreateModelData, Provider } from "@shared/triplit/types";
// Import AI SDK types
import { type LanguageModelUsage, smoothStream, streamText } from "ai";
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
  ): Promise<{ success: boolean; error?: string }> {
    const { tabId, threadId, userMessageId, messages, modelName } = params;
    const controller = this.createAbortController(tabId);

    let fullContent = "";

    try {
      const model = this.openai(modelName);

      Logger.info(`Starting stream chat for tab ${tabId}, thread ${threadId}`);

      // Convert messages to ModelMessage format with attachment support
      const modelMessages = await convertMessagesToModelMessages(
        messages,
        {
          apiKey: this.provider.apiKey,
          baseUrl: this.provider.baseUrl,
        },
        userMessageId,
      );

      Logger.info("Converted messages for AI SDK:", modelMessages);

      // Log the final message structure for debugging
      modelMessages.forEach((msg, index) => {
        Logger.info(`Message ${index}:`, {
          role: msg.role,
          contentType: typeof msg.content,
          contentLength: Array.isArray(msg.content)
            ? msg.content.length
            : typeof msg.content === "string"
              ? msg.content.length
              : "unknown",
          hasContentParts: Array.isArray(msg.content),
        });
      });

      const result = streamText({
        model,
        messages: modelMessages,
        experimental_transform: smoothStream(),
        abortSignal: controller.signal,
      });

      // Send stream start event
      this.sendToAllWindows("chat:stream-start", {
        tabId,
        threadId,
        userMessageId,
        providerId: this.provider.id,
      });

      // Process stream
      for await (const delta of result.textStream) {
        fullContent += delta;
        // Send delta to renderer
        this.sendToAllWindows("chat:stream-delta", {
          tabId,
          threadId,
          userMessageId,
          delta,
          fullContent,
        });
      }

      let usage: LanguageModelUsage | null = null;
      // Send stream end event
      if (fullContent !== "") {
        usage = await result.usage;
      }
      console.log("fullContent", fullContent);
      this.sendToAllWindows("chat:stream-end", {
        tabId,
        threadId,
        userMessageId,
        fullContent,
        usage,
      });

      Logger.info(`Stream chat completed for tab ${tabId}`);
      return { success: true };
    } catch (error) {
      console.error("error1:", error);
      if (error instanceof Error && error.name === "AbortError") {
        Logger.info(`Stream aborted for tab ${tabId}`);
        // Send a specific event for abortion, or handle silently
        this.sendToAllWindows("chat:stream-stop", {
          tabId,
          threadId,
          userMessageId,
          fullContent,
        });
        return { success: true };
      }

      Logger.error(`Stream chat error for tab ${tabId}:`, error);

      // Send error event
      this.sendToAllWindows("chat:stream-error", {
        tabId,
        threadId,
        userMessageId,
        error: extractErrorMessage(error),
      });

      return {
        success: false,
        error: extractErrorMessage(error),
      };
    } finally {
      this.cleanupAbortController(tabId);
    }
  }

  async reGenerateStreamChat(
    params: StreamChatParams,
    regenerateMessageId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { tabId, threadId, userMessageId, messages, modelName } = params;
    const controller = this.createAbortController(tabId);

    try {
      const model = this.openai(modelName);

      Logger.info(
        `Starting regenerate stream chat for tab ${tabId}, thread ${threadId}, regenerating message ${regenerateMessageId}`,
      );

      // Convert messages to ModelMessage format with attachment support
      const modelMessages = await convertMessagesToModelMessages(messages, {
        apiKey: this.provider.apiKey,
        baseUrl: this.provider.baseUrl,
      });

      const result = streamText({
        model,
        messages: modelMessages,
        experimental_transform: smoothStream(),
        abortSignal: controller.signal,
      });

      // Send regenerate stream start event
      this.sendToAllWindows("chat:regenerate-stream-start", {
        tabId,
        threadId,
        userMessageId,
        regenerateMessageId,
        providerId: this.provider.id,
      });

      let fullContent = "";

      // Process stream
      for await (const delta of result.textStream) {
        fullContent += delta;

        // Send delta to renderer
        this.sendToAllWindows("chat:regenerate-stream-delta", {
          tabId,
          threadId,
          userMessageId,
          regenerateMessageId,
          delta,
          fullContent,
        });
      }

      // Send regenerate stream end event
      const usage = await result.usage;
      this.sendToAllWindows("chat:regenerate-stream-end", {
        tabId,
        threadId,
        userMessageId,
        regenerateMessageId,
        fullContent,
        usage,
        providerId: this.provider.id,
      });

      Logger.info(`Regenerate stream chat completed for tab ${tabId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        Logger.info(`Regenerate stream aborted for tab ${tabId}`);
        this.sendToAllWindows("chat:regenerate-stream-error", {
          tabId,
          threadId,
          userMessageId,
          regenerateMessageId,
          error: "Cancelled by user.",
          providerId: this.provider.id,
        });
        return { success: true }; // Successful cancellation
      }
      Logger.error(`Regenerate stream chat error for tab ${tabId}:`, error);

      // Send error event
      this.sendToAllWindows("chat:regenerate-stream-error", {
        tabId,
        threadId,
        userMessageId,
        regenerateMessageId,
        error: extractErrorMessage(error),
        providerId: this.provider.id,
      });

      return {
        success: false,
        error: extractErrorMessage(error),
      };
    } finally {
      this.cleanupAbortController(tabId);
    }
  }
}
