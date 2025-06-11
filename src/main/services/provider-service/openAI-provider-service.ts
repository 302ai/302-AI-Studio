import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { betterFetch } from "@better-fetch/fetch";
import { fetchOpenAIModels } from "@main/api/ai";
import type { CreateModelData, Provider } from "@shared/triplit/types";
// Import AI SDK types
import { type ModelMessage, smoothStream, streamText } from "ai";
import Logger from "electron-log";
import {
  BaseProviderService,
  type ChatMessage,
  type StreamChatParams,
} from "./base-provider-service";

export class OpenAIProviderService extends BaseProviderService {
  protected openai: OpenAIProvider;

  /**
   * Parse file content using 302.ai API
   */
  private async parseFileContent(attachment: {
    id: string;
    name: string;
    type: string;
    fileData: string;
  }): Promise<string> {
    const baseUrl = this.provider.baseUrl;
    const apiKey = this.provider.apiKey;
    const timeout = 30000; // Increase timeout for file processing

    try {
      Logger.info("Starting file parsing for:", {
        fileName: attachment.name,
        fileType: attachment.type,
        fileSize: attachment.fileData.length,
      });

      // Convert data URL to File object for multipart/form-data
      const dataURLPattern = /^data:([^;]+);base64,(.+)$/;
      const match = attachment.fileData.match(dataURLPattern);

      if (!match) {
        throw new Error("Invalid file data format");
      }

      const mimeType = match[1];
      const base64Data = match[2];

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, "base64");

      // Create FormData for multipart/form-data
      const formData = new FormData();

      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: mimeType });

      // Add the file to FormData
      formData.append("file", blob, attachment.name);

      // Step 1: Upload file
      Logger.info("Uploading file to 302.ai...");
      const uploadResponse = await betterFetch(`${baseUrl}/302/upload-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
        timeout,
      });

      const fileUrl = (uploadResponse.data as any).data;
      Logger.info("File uploaded successfully:", fileUrl);

      // Step 2: Parse file content
      Logger.info("Parsing file content...");
      const parseResponse = await betterFetch(
        `https://api.302.ai/302/file/parsing`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          query: {
            url: fileUrl,
          },
          timeout,
        },
      );

      const fileContent = (parseResponse.data as any).data.msg;
      Logger.info("File parsed successfully:", {
        contentLength: fileContent.length,
        contentPreview: fileContent.substring(0, 200),
      });

      return fileContent;
    } catch (error) {
      Logger.error("File parsing failed:", error);
      throw new Error(
        `Failed to parse file ${attachment.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async convertToModelMessage(
    message: ChatMessage,
    messageId?: string,
  ): Promise<ModelMessage> {
    if (message.role === "user" && message.attachments) {
      let attachments: Array<{
        id: string;
        name: string;
        size: number;
        type: string;
        preview?: string;
        fileData?: string;
        fileContent?: string;
      }> = [];
      try {
        attachments = JSON.parse(message.attachments);
        Logger.info("Parsed attachments:", attachments.length);
      } catch (error) {
        Logger.warn("Failed to parse attachments:", error);
        attachments = [];
      }

      let attachmentsUpdated = false;

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

        // Process attachments
        for (const attachment of attachments) {
          Logger.info("Processing attachment:", {
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            hasPreview: !!attachment.preview,
            hasFileData: !!attachment.fileData,
            hasFileContent: !!attachment.fileContent,
          });

          if (attachment.type?.startsWith("image/") && attachment.preview) {
            Logger.info("Adding image attachment");
            contentParts.push({
              type: "image",
              image: attachment.preview,
            });
          } else if (attachment.fileContent) {
            // Use pre-parsed file content if available (from database)
            Logger.info("Using pre-parsed file content from database");
            contentParts.push({
              type: "text",
              text: `\n\n[File: ${attachment.name}]\n${attachment.fileContent}\n[End of file]\n`,
            });

            Logger.info("Successfully added pre-parsed file content:", {
              fileName: attachment.name,
              contentLength: attachment.fileContent.length,
            });
          } else if (attachment.fileData && attachment.type) {
            try {
              // Parse file content on-demand (first time)
              const parsedContent = await this.parseFileContent({
                id: attachment.id,
                name: attachment.name,
                type: attachment.type,
                fileData: attachment.fileData,
              });

              // Cache the parsed content back to the attachment for future use
              attachment.fileContent = parsedContent;
              attachmentsUpdated = true;

              // Add parsed content as text with file context
              contentParts.push({
                type: "text",
                text: `\n\n[File: ${attachment.name}]\n${parsedContent}\n[End of file]\n`,
              });

              Logger.info("Successfully added parsed file content:", {
                fileName: attachment.name,
                contentLength: parsedContent.length,
              });
            } catch (error) {
              Logger.error("Failed to parse file:", error);

              // Add error message as text
              contentParts.push({
                type: "text",
                text: `\n\n[File: ${attachment.name} - Failed to parse: ${error instanceof Error ? error.message : "Unknown error"}]\n`,
              });
            }
          } else {
            Logger.warn("Skipping attachment due to missing data:", {
              hasFileData: !!attachment.fileData,
              hasType: !!attachment.type,
              hasPreview: !!attachment.preview,
              hasFileContent: !!attachment.fileContent,
            });
          }
        }

        const result = {
          role: "user",
          content: contentParts,
        } as ModelMessage;

        // If attachments were updated with parsed content, notify renderer to update database
        if (attachmentsUpdated && messageId) {
          this.sendToAllWindows("chat:attachments-updated", {
            messageId,
            attachments: JSON.stringify(attachments),
          });
        }

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

      // Convert messages to ModelMessage format with attachment support
      const modelMessages = await Promise.all(
        messages
          .filter((msg) => msg.role !== "function") // Filter out function messages
          .map((msg, index) => {
            // For user messages, try to find the messageId (usually the last user message)
            const messageId = msg.role === "user" && index === messages.length - 1 ? userMessageId : undefined;
            return this.convertToModelMessage(msg, messageId);
          }),
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
          contentParts: Array.isArray(msg.content)
            ? msg.content.map((part: any) => ({
                type: part.type,
                hasData: "data" in part || "image" in part || "text" in part,
              }))
            : "not-array",
        });
      });

      const result = streamText({
        model,
        messages: modelMessages,
        experimental_transform: smoothStream(),
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

      // Convert messages to ModelMessage format with attachment support
      const modelMessages = await Promise.all(
        messages
          .filter((msg) => msg.role !== "function") // Filter out function messages
          .map((msg) => this.convertToModelMessage(msg)),
      );

      const result = streamText({
        model,
        messages: modelMessages,
        experimental_transform: smoothStream(),
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
