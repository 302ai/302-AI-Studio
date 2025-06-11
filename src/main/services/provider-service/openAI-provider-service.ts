import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { fetchOpenAIModels } from "@shared/api/ai";
import type { CreateModelData, Provider } from "@shared/triplit/types";
// Import AI SDK types
import type { ModelMessage } from "ai";
import Logger from "electron-log";
import {
  BaseProviderService,
  type ChatMessage,
  type StreamChatParams,
} from "./base-provider-service";

export class OpenAIProviderService extends BaseProviderService {
  protected openai: OpenAIProvider;

  private convertToModelMessage(message: ChatMessage): ModelMessage {
    if (message.role === "user" && message.attachments) {
      let attachments: Array<{
        id: string;
        name: string;
        size: number;
        type: string;
        preview?: string;
        fileData?: string;
      }> = [];
      try {
        attachments = JSON.parse(message.attachments);
        Logger.info("Parsed attachments:", attachments.length);
      } catch (error) {
        Logger.warn("Failed to parse attachments:", error);
        attachments = [];
      }

      if (attachments.length > 0) {
        const contentParts: Array<
          | {
              type: "text";
              text: string;
            }
          | {
              type: "image";
              image: string;
            }
          | {
              type: "file";
              data: string;
              mimeType: string;
            }
        > = [];

        // Add text content if it exists
        if (message.content.trim()) {
          contentParts.push({
            type: "text",
            text: message.content,
          });
        }

        for (const attachment of attachments) {
          if (attachment.type?.startsWith("image/") && attachment.preview) {
            Logger.info("Adding image attachment");
            contentParts.push({
              type: "image",
              image: attachment.preview,
            });
          } else if (attachment.fileData && attachment.type) {
            if (!attachment.fileData.startsWith("data:")) {
              Logger.warn(
                "File data does not start with 'data:', this might cause issues",
              );
            }

            // Check if the data URL format is correct
            const dataURLPattern = /^data:([^;]+);base64,(.+)$/;
            const match = attachment.fileData.match(dataURLPattern);
            if (!match) {
              Logger.warn("File data does not match expected data URL pattern");
            } else {
              Logger.info("File data validation passed:", {
                mimeType: match[1],
                base64Length: match[2].length,
              });
            }

            contentParts.push({
              type: "file",
              data: attachment.fileData,
              mimeType: attachment.type,
            });
          } else {
            Logger.warn("Skipping attachment due to missing data:", {
              hasFileData: !!attachment.fileData,
              hasType: !!attachment.type,
              hasPreview: !!attachment.preview,
            });
          }
        }

        const result = {
          role: "user",
          content: contentParts,
        } as ModelMessage;

        return result;
      }
    }

    // For messages without attachments or non-user messages
    const result = {
      role: message.role as "user" | "assistant" | "system",
      content: message.content,
    } as ModelMessage;

    Logger.info("Created simple message:", {
      role: result.role,
      contentLength:
        typeof result.content === "string"
          ? result.content.length
          : "not-string",
    });

    return result;
  }

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
    params: StreamChatParams,
  ): Promise<{ success: boolean; error?: string }> {
    const { tabId, threadId, userMessageId, messages, modelName } = params;

    try {
      const model = this.openai(modelName);

      Logger.info(`Starting stream chat for tab ${tabId}, thread ${threadId}`);

      // Start streaming
      const { streamText: streamTextFn } = await import("ai");

      // Convert messages to ModelMessage format with attachment support
      const modelMessages = messages
        .filter((msg) => msg.role !== "function") // Filter out function messages
        .map((msg) => this.convertToModelMessage(msg));

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
          contentParts: Array.isArray(msg.content)
            ? msg.content.map((part: any) => ({
                type: part.type,
                hasData: "data" in part || "image" in part || "text" in part,
              }))
            : "not-array",
        });
      });

      const result = streamTextFn({
        model,
        messages: modelMessages,
      });

      // Send stream start event
      this.sendToAllWindows("chat:stream-start", {
        tabId,
        threadId,
        userMessageId,
        providerId: this.provider.id,
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
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async reGenerateStreamChat(
    params: StreamChatParams,
    regenerateMessageId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { tabId, threadId, userMessageId, messages, modelName } = params;

    try {
      const model = this.openai(modelName);

      Logger.info(
        `Starting regenerate stream chat for tab ${tabId}, thread ${threadId}, regenerating message ${regenerateMessageId}`,
      );

      // Start streaming
      const { streamText: streamTextFn } = await import("ai");

      // Convert messages to ModelMessage format with attachment support
      const modelMessages = messages
        .filter((msg) => msg.role !== "function") // Filter out function messages
        .map((msg) => this.convertToModelMessage(msg));

      const result = streamTextFn({
        model,
        messages: modelMessages,
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
      Logger.error(`Regenerate stream chat error for tab ${tabId}:`, error);

      // Send error event
      this.sendToAllWindows("chat:regenerate-stream-error", {
        tabId,
        threadId,
        userMessageId,
        regenerateMessageId,
        error: error instanceof Error ? error.message : "Unknown error",
        providerId: this.provider.id,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
