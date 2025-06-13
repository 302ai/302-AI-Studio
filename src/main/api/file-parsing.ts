import { betterFetch } from "@better-fetch/fetch";
import { extractErrorMessage } from "@main/utils/error-utils";
import { z } from "zod";

// Type definitions for 302.ai API responses
const fileUploadResponseSchema = z.object({
  data: z.string(), // The file URL
});

const fileParsingResponseSchema = z.object({
  data: z.object({
    msg: z.string(), // The parsed file content
  }),
});

export type FileUploadResponse = z.infer<typeof fileUploadResponseSchema>;
export type FileParsingResponse = z.infer<typeof fileParsingResponseSchema>;

// Type definition for attachment objects for parsing
export interface AttachmentForParsing {
  id: string;
  name: string;
  type: string;
  fileData: string;
}

export interface FileParsingOptions {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

/**
 * Upload file to 302.ai API
 * @param attachment - The attachment to upload
 * @param options - The options for the upload request
 * @returns The file URL
 */
export async function uploadFile(
  attachment: AttachmentForParsing,
  options: FileParsingOptions,
): Promise<string> {
  const { apiKey, baseUrl, timeout = 30000 } = options;

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

  const { data, error } = await betterFetch<FileUploadResponse>(
    `${baseUrl}/302/upload-file`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      timeout,
    },
  );

  if (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Failed to upload file: ${errorMessage}`);
  }

  if (!data) {
    throw new Error("Failed to upload file: No response data");
  }

  return data.data;
}

/**
 * Parse file content using 302.ai API
 * @param fileUrl - The URL of the uploaded file
 * @param options - The options for the parsing request
 * @returns The parsed file content
 */
export async function parseFileContent(
  fileUrl: string,
  options: FileParsingOptions,
): Promise<string> {
  const { apiKey, timeout = 30000 } = options;

  const { data, error } = await betterFetch<FileParsingResponse>(
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

  if (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Failed to parse file: ${errorMessage}`);
  }

  if (!data) {
    throw new Error("Failed to parse file: No response data");
  }

  return data.data.msg;
}

/**
 * Upload and parse file content using 302.ai API
 * @param attachment - The attachment to process
 * @param options - The options for the API requests
 * @returns The parsed file content
 */
export async function uploadAndParseFile(
  attachment: AttachmentForParsing,
  options: FileParsingOptions,
): Promise<string> {
  // Step 1: Upload file
  const fileUrl = await uploadFile(attachment, options);

  // Step 2: Parse file content
  const content = await parseFileContent(fileUrl, options);

  return content;
}
