import { uploadAndParseFile } from "@main/api/file-parsing";
import type { FilePart, ImagePart, ModelMessage, TextPart } from "ai";
import { BrowserWindow } from "electron";
import Logger from "electron-log";

// Type definitions for AI SDK content parts - using the actual AI SDK types
type ContentPart = TextPart | ImagePart | FilePart;

// Type definition for chat message
export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  attachments?: string | null;
}

// Type definition for attachment objects
interface AttachmentData {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  fileData?: string;
  fileContent?: string;
}

// Type definition for provider options
export interface ProviderOptions {
  apiKey: string;
  baseUrl: string;
}

/**
 * Convert chat message to AI SDK ModelMessage format with attachment support
 * @param message - The chat message to convert
 * @param providerOptions - Provider API configuration
 * @param messageId - Optional message ID for attachment updates
 * @returns Promise<ModelMessage> - The converted message
 */
export async function convertToModelMessage(
  message: ChatMessage,
  providerOptions: ProviderOptions,
  messageId?: string,
): Promise<ModelMessage> {
  if (message.role === "user" && message.attachments) {
    let attachments: AttachmentData[] = [];
    try {
      attachments = JSON.parse(message.attachments);
    } catch (error) {
      Logger.warn("Failed to parse attachments:", error);
      attachments = [];
    }

    let attachmentsUpdated = false;

    if (attachments.length > 0) {
      const contentParts: ContentPart[] = [];

      // Add text content if it exists
      if (message.content.trim()) {
        contentParts.push({
          type: "text",
          text: message.content,
        });
      }

      // Process attachments
      for (const attachment of attachments) {

        if (attachment.type?.startsWith("image/") && attachment.preview) {
          contentParts.push({
            type: "image",
            image: attachment.preview,
          });
        } else if (attachment.fileContent) {
          // Use pre-parsed file content if available (from database)
          contentParts.push({
            type: "text",
            text: `${attachment.name}\n${attachment.fileContent}`,
          });

        } else if (attachment.fileData && attachment.type) {
          try {
            // Parse file content on-demand (first time)
            // TODO: 不能与provider耦合
            const parsedContent = await uploadAndParseFile(
              {
                id: attachment.id,
                name: attachment.name,
                type: attachment.type,
                fileData: attachment.fileData,
              },
              {
                apiKey: providerOptions.apiKey,
                baseUrl: providerOptions.baseUrl,
                timeout: 30000,
              },
            );

            // Cache the parsed content back to the attachment for future use
            attachment.fileContent = parsedContent;
            attachmentsUpdated = true;

            // Add parsed content as text with file context
            contentParts.push({
              type: "text",
              text: `${attachment.name}\n${parsedContent}`,
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
          Logger.warn("Skipping attachment due to missing data");
        }
      }

      const result = {
        role: "user",
        content: contentParts,
      } as ModelMessage;

      // If attachments were updated with parsed content, notify renderer to update database
      if (attachmentsUpdated && messageId) {
        sendToAllWindows("chat:attachments-updated", {
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
      typeof result.content === "string" ? result.content.length : "not-string",
  });

  return result;
}

// Type definition for IPC event data
interface AttachmentsUpdatedEventData {
  messageId: string;
  attachments: string;
}

/**
 * Helper function to send IPC events to all windows
 * @param channel - The IPC channel name
 * @param data - The data to send
 */
function sendToAllWindows(channel: string, data: AttachmentsUpdatedEventData) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, data);
  });
}

/**
 * Convert multiple chat messages to AI SDK ModelMessage format
 * @param messages - Array of chat messages to convert
 * @param providerOptions - Provider API configuration
 * @param userMessageId - Optional user message ID for attachment updates
 * @returns Promise<ModelMessage[]> - Array of converted messages
 */
export async function convertMessagesToModelMessages(
  messages: ChatMessage[],
  providerOptions: ProviderOptions,
  userMessageId?: string,
): Promise<ModelMessage[]> {
  return await Promise.all(
    messages
      .filter((msg) => msg.role !== "function") // Filter out function messages
      .map((msg, index) => {
        // For user messages, try to find the messageId (usually the last user message)
        const messageId =
          msg.role === "user" && index === messages.length - 1
            ? userMessageId
            : undefined;
        return convertToModelMessage(msg, providerOptions, messageId);
      }),
  );
}
