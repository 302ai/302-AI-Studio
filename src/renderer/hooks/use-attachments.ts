import { nanoid } from "nanoid";
import { useCallback, useState } from "react";

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string; // base64 data URL for images
  fileData?: string; // base64 file data for non-image files (for preview)
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 10MB
export const ALLOWED_TYPES = [
  // JSON and JavaScript
  "application/json",
  "application/javascript",
  "text/javascript",

  // Text files
  "text/plain",
  "text/csv",
  "text/markdown",
  "text/html",
  "text/css",
  "text/xml",

  // Excel and spreadsheet files
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
  "application/vnd.apple.numbers",

  // YAML and XML
  "application/x-yaml",
  "application/yaml",
  "text/yaml",
  "text/x-yaml",
  "application/xml",
  "text/xml",

  // TypeScript and programming languages
  "application/typescript",
  "text/typescript",
  "text/x-typescript",
  "application/x-typescript",

  // Shell scripts
  "application/x-sh",
  "text/x-shellscript",

  // Document files
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Web files
  "application/xhtml+xml",

  // Image files
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",

  // Audio files
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
];

export function useAttachments() {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  const addAttachments = useCallback(async (files: FileList) => {
    const newAttachments: AttachmentFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // File size validation
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File ${file.name} is too large (${file.size} bytes)`);
        continue;
      }

      // File type validation - check against allowed types or common patterns
      const isAllowed =
        ALLOWED_TYPES.includes(file.type) ||
        file.type.startsWith("text/") ||
        file.type.startsWith("image/") ||
        file.type.startsWith("audio/");

      if (!isAllowed) {
        console.warn(`File type ${file.type} is not allowed`);
        continue;
      }

      const attachmentId = nanoid();
      console.log("Generated attachment ID:", attachmentId, "for file:", file.name);

      const attachment: AttachmentFile = {
        id: attachmentId,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      };

      console.log("Created attachment object:", {
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        preview: attachment.preview,
      });

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        try {
          console.log("Starting to generate preview for", file.name);
          const preview = await readFileAsDataURL(file);
          console.log("Generated preview for", file.name, ":", {
            length: preview.length,
            start: preview.substring(0, 100),
            isValidDataURL: preview.startsWith("data:"),
          });
          attachment.preview = preview;
          console.log("Attachment after setting preview:", {
            name: attachment.name,
            previewLength: attachment.preview?.length,
            previewStart: attachment.preview?.substring(0, 100),
          });
        } catch (error) {
          console.error("Failed to generate preview:", error);
        }
      } else {
        // For non-image files (including audio), generate file data for preview if file is small enough
        const maxPreviewSize = MAX_FILE_SIZE; // 5MB limit for preview data
        if (file.size <= maxPreviewSize) {
          try {
            console.log("Generating file data for", file.name);
            const fileData = await readFileAsDataURL(file);
            attachment.fileData = fileData;
            console.log("Generated file data for", file.name, ":", {
              length: fileData.length,
              start: fileData.substring(0, 100),
            });
          } catch (error) {
            console.error("Failed to generate file data:", error);
          }
        } else {
          console.log("File too large for preview data generation:", file.name);
        }
      }

      newAttachments.push(attachment);
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return {
    attachments,
    addAttachments,
    removeAttachment,
    clearAttachments,
  };
}


function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
