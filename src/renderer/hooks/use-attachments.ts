import { nanoid } from "nanoid";
import { useState, useCallback } from "react";

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string; // base64 data URL for images
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 10MB
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

      const attachment: AttachmentFile = {
        id: nanoid(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      };

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        try {
          const preview = await readFileAsDataURL(file);
          attachment.preview = preview;
        } catch (error) {
          console.error("Failed to generate preview:", error);
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
