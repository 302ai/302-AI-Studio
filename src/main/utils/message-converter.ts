import type { AttachmentService } from "@main/services/attachment-service";
import type { FilePart, ImagePart, ModelMessage, TextPart } from "ai";
import Logger from "electron-log";
import { FilePresenter } from "../services/file-service/file-parse-service";
import { container } from "../shared/bindings";
import { TYPES } from "../shared/types";

// Type definitions for AI SDK content parts - using the actual AI SDK types
type ContentPart = TextPart | ImagePart | FilePart;

// Type definition for chat message
export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  id?: string; // Add message ID to support attachment lookup
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

/**
 * Convert chat message to AI SDK ModelMessage format with attachment support
 * @param message - The chat message to convert
 * @param messageId - Optional message ID for attachment updates
 * @returns Promise<ModelMessage> - The converted message
 */
export async function convertToModelMessage(
  message: ChatMessage,
  messageId?: string,
): Promise<ModelMessage> {
  // Create FilePresenter instance for local file parsing
  const filePresenter = new FilePresenter();

  if (message.role === "user" && (message.id || messageId)) {
    // Get attachments from database using the new attachment service
    const attachmentService = container.get<AttachmentService>(
      TYPES.AttachmentService,
    );
    const newMessageId = message.id || messageId;
    let attachments: AttachmentData[] = [];

    if (newMessageId) {
      try {
        const dbAttachments =
          await attachmentService._getAttachmentsByMessageId(newMessageId);
        attachments = dbAttachments.map((att) => ({
          id: att.id,
          name: att.name,
          size: att.size,
          type: att.type,
          preview: att.preview || undefined,
          fileData: att.fileData || undefined,
          fileContent: att.fileContent || undefined,
        }));
      } catch (error) {
        Logger.warn("Failed to get attachments from database:", error);
        attachments = [];
      }
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
            // Parse file content using local file adapters
            // Write attachment data to temporary file
            const tempFilePath = await filePresenter.writeTemp({
              name: attachment.name,
              content: attachment.fileData,
            });

            // Use FilePresenter to prepare and parse the file
            const messageFile = await filePresenter.prepareFile(
              tempFilePath,
              attachment.type,
            );
            const parsedContent = messageFile.content;

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

      // If attachments were updated with parsed content, update them in database
      if (attachmentsUpdated && newMessageId) {
        try {
          for (const attachment of attachments) {
            if (attachment.fileContent) {
              await attachmentService._updateAttachment(attachment.id, {
                fileContent: attachment.fileContent,
              });
            }
          }
        } catch (error) {
          Logger.error("Failed to update attachments in database:", error);
        }
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

/**
 * Convert multiple chat messages to AI SDK ModelMessage format
 * @param messages - Array of chat messages to convert
 * @param userMessageId - Optional user message ID for attachment updates
 * @returns Promise<ModelMessage[]> - Array of converted messages
 */
export async function convertMessagesToModelMessages(
  messages: ChatMessage[],
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
        return convertToModelMessage(msg, messageId);
      }),
  );
}
