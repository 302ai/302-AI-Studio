import {
  type AttachmentForParsing,
  type FileParsingOptions,
  uploadAndParseFile,
} from "@main/api/file-parsing";
import Logger from "electron-log";

/**
 * File parsing service for processing file content using 302.ai API
 */
export class FileParsingService {
  private options: FileParsingOptions;

  constructor(options: FileParsingOptions) {
    this.options = {
      timeout: 30000, // Default 30 seconds
      ...options,
    };
  }

  /**
   * Parse file content using 302.ai API
   */
  async parseFileContent(attachment: AttachmentForParsing): Promise<string> {
    try {
      Logger.info("Starting file parsing for:", {
        fileName: attachment.name,
      });

      const fileContent = await uploadAndParseFile(attachment, this.options);

      Logger.info("File parsed successfully");

      return fileContent;
    } catch (error) {
      Logger.error("File parsing failed:", error);
      throw new Error(
        `Failed to parse file ${attachment.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if a file type should be parsed
   */
  static shouldParseFile(type: string): boolean {
    // Don't parse images as they are handled differently
    if (type.startsWith("image/")) {
      return false;
    }

    // Parse text files and documents
    return (
      type.startsWith("text/") ||
      type.startsWith("application/") ||
      type.startsWith("audio/")
    );
  }
}
