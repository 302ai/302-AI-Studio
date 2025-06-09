import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { fetchOpenAIModels } from "@shared/api/ai";
import type { CreateModelData, Provider } from "@shared/triplit/types";
import Logger from "electron-log";
import { BaseProviderService, type StreamChatParams } from "./base-provider-service";

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
      let errorMessage = "An unknown error occurred during provider check.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

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

      throw error;
    }
  }

  async startStreamChat(
    params: StreamChatParams
  ): Promise<{ success: boolean; error?: string }> {
    const { tabId, threadId, userMessageId, messages, modelName } = params;

    try {
      const model = this.openai(modelName);

      Logger.info(`Starting stream chat for tab ${tabId}, thread ${threadId}`);

      // Start streaming
      const { streamText: streamTextFn } = await import("ai");
      const result = streamTextFn({
        model,
        messages: messages
          .filter((msg) => msg.role !== "function") // Filter out function messages
          .map((msg) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          })),
      });

      // Send stream start event
      this.sendToAllWindows("chat:stream-start", {
        tabId,
        threadId,
        userMessageId,
      });

      let fullContent = "";

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

      // Send stream end event
      const usage = await result.usage;
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
      Logger.error(`Stream chat error for tab ${tabId}:`, error);

      // Send error event
      this.sendToAllWindows("chat:stream-error", {
        tabId,
        threadId,
        userMessageId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async reGenerateStreamChat(
    params: StreamChatParams,
    regenerateMessageId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { tabId, threadId, userMessageId, messages, modelName } = params;

    try {
      const model = this.openai(modelName);

      Logger.info(`Starting regenerate stream chat for tab ${tabId}, thread ${threadId}, regenerating message ${regenerateMessageId}`);

      // Start streaming
      const { streamText: streamTextFn } = await import("ai");
      const result = streamTextFn({
        model,
        messages: messages
          .filter((msg) => msg.role !== "function") // Filter out function messages
          .map((msg) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          })),
      });

      // Send regenerate stream start event
      this.sendToAllWindows("chat:regenerate-stream-start", {
        tabId,
        threadId,
        userMessageId,
        regenerateMessageId,
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
      });

      Logger.info(`Regenerate stream chat completed for tab ${tabId}`);
      return { success: true };

    } catch (error) {
      Logger.error(`Regenerate stream chat error for tab ${tabId}:`, error);

      // Send error event
      this.sendToAllWindows("chat:regenerate-stream-error", {
        tabId,
        threadId,
        userMessageId,
        regenerateMessageId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
