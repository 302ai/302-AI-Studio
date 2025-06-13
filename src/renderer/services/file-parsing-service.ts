import { betterFetch } from "@better-fetch/fetch";
import Logger from "electron-log";

export interface FileParsingOptions {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export interface AttachmentForParsing {
  id: string;
  name: string;
  type: string;
  fileData: string;
}

// Type definitions for 302.ai API responses
interface FileUploadResponse {
  data: string; // The file URL
}

interface FileParsingResponse {
  data: {
    msg: string; // The parsed file content
  };
}

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
    const { apiKey, baseUrl, timeout } = this.options;

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
      const buffer = Buffer.from(base64Data, 'base64');

      // Create FormData for multipart/form-data
      const formData = new FormData();

      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: mimeType });

      // Add the file to FormData
      formData.append('file', blob, attachment.name);

      // Step 1: Upload file
      Logger.info("Uploading file to 302.ai...");
      const { data: uploadData, error: uploadError } = await betterFetch<FileUploadResponse>(`${baseUrl}/302/upload-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
        timeout,
      });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError}`);
      }

      if (!uploadData) {
        throw new Error("Failed to upload file: No response data");
      }

      const fileUrl = uploadData.data;
      Logger.info("File uploaded successfully:", fileUrl);

      // Step 2: Parse file content
      Logger.info("Parsing file content...");
      const { data: parseData, error: parseError } = await betterFetch<FileParsingResponse>(`https://api.302.ai/302/file/parsing`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        query: {
          url: fileUrl,
        },
        timeout,
      });

      if (parseError) {
        throw new Error(`Failed to parse file: ${parseError}`);
      }

      if (!parseData) {
        throw new Error("Failed to parse file: No response data");
      }

      const fileContent = parseData.data.msg;
      Logger.info("File parsed successfully:", {
        contentLength: fileContent.length,
        contentPreview: fileContent.substring(0, 200),
      });

      return fileContent;
    } catch (error) {
      Logger.error("File parsing failed:", error);
      throw new Error(`Failed to parse file ${attachment.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
