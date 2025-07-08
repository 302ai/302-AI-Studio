import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useActiveTab } from "./use-active-tab";
import logger from "@shared/logger/renderer-logger";

const { tabService } = window.service;

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  filePath: string;
  preview?: string; // base64 data URL for images
  fileData?: string; // base64 file data for non-image files (for preview)
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

// Process attachment data and convert to FileList
const processAttachmentsFromData = (
  attachmentData: Array<{
    name: string;
    type: string;
    preview?: string;
    fileData?: string;
  }>,
): FileList => {
  const dataTransfer = new DataTransfer();

  attachmentData.forEach((attachment) => {
    // Check if it's an image (has preview) or other file type (has fileData)
    const base64Data = attachment.preview || attachment.fileData;
    if (base64Data) {
      // Convert base64 data to File object
      const byteString = atob(base64Data.split(",")[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const int8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        int8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([int8Array], { type: attachment.type });
      const file = new File([blob], attachment.name, {
        type: attachment.type,
      });
      dataTransfer.items.add(file);
    }
  });

  return dataTransfer.files;
};

export function useAttachments() {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const { activeTabId } = useActiveTab();
  const { t } = useTranslation("translation", {
    keyPrefix: "attachment",
  });

  // 保存文件到tab
  const saveFilesToTab = useCallback(
    async (files: AttachmentFile[]) => {
      if (activeTabId) {
        try {
          const filesData = files.map((file) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            filePath: file.filePath,
            preview: file.preview,
            fileData: file.fileData,
          }));
          await tabService.updateTab(activeTabId, {
            files: JSON.stringify(filesData),
          });
        } catch (error) {
          logger.error("Failed to save files to tab", { error });
        }
      }
    },
    [activeTabId],
  );

  // 从tab加载文件
  const loadFilesFromTab = useCallback(async () => {
    if (activeTabId) {
      try {
        const tab = await tabService.getTab(activeTabId);
        if (tab?.files) {
          const filesData = JSON.parse(tab.files);
          if (Array.isArray(filesData) && filesData.length > 0) {
            const fileList = processAttachmentsFromData(filesData);
            const loadedAttachments: AttachmentFile[] = [];

            for (let i = 0; i < fileList.length; i++) {
              const file = fileList[i];
              const originalData = filesData[i];

              const attachment: AttachmentFile = {
                id: originalData.id,
                name: file.name,
                size: file.size,
                type: file.type,
                file,
                filePath: originalData.filePath,
                preview: originalData.preview,
                fileData: originalData.fileData,
              };

              loadedAttachments.push(attachment);
            }

            setAttachments(loadedAttachments);
          } else {
            setAttachments([]);
          }
        } else {
          setAttachments([]);
        }
      } catch (error) {
        logger.error("Failed to load files from tab", { error });
        setAttachments([]);
      }
    } else {
      setAttachments([]);
    }
  }, [activeTabId]);

  // 当tab切换时，加载对应的文件
  useEffect(() => {
    loadFilesFromTab();
  }, [loadFilesFromTab]);

  const addAttachments = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);

      const processedAttachments = await Promise.all(
        fileArray.map(async (file) => {
          // 文件大小验证
          if (file.size > MAX_FILE_SIZE) {
            toast.error(t("file-too-large"));
            logger.warn(`File ${file.name} is too large (${file.size} bytes)`);
            return null;
          }

          // 文件类型验证
          const isAllowed =
            ALLOWED_TYPES.includes(file.type) ||
            file.type.startsWith("text/") ||
            file.type.startsWith("image/") ||
            file.type.startsWith("audio/");

          if (!isAllowed) {
            logger.warn(`File type ${file.type} is not allowed`);
            return null;
          }

          // 创建基础附件对象
          const attachment: AttachmentFile = {
            id: nanoid(),
            name: file.name,
            size: file.size,
            type: file.type,
            file,
            filePath: "",
          };

          try {
            attachment.filePath = window.api.webUtils.getPathForFile(file);
          } catch (error) {
            logger.warn(`Failed to get file path for ${file.name}`, { error });
          }

          // 生成预览数据
          try {
            if (file.type.startsWith("image/")) {
              const preview = await readFileAsDataURL(file);
              attachment.preview = preview;
            } else if (file.size <= MAX_FILE_SIZE) {
              const fileData = await readFileAsDataURL(file);
              attachment.fileData = fileData;
            }
          } catch (error) {
            logger.error(`Failed to generate preview/data for ${file.name}`, {
              error,
            });
          }

          return attachment;
        }),
      );

      // 过滤掉无效的文件
      const validAttachments = processedAttachments.filter(
        (attachment): attachment is AttachmentFile => attachment !== null,
      );

      const updatedAttachments = [...attachments, ...validAttachments];
      setAttachments(updatedAttachments);

      // 保存到 tab
      try {
        await saveFilesToTab(updatedAttachments);
        logger.debug("✅ Saved to tab successfully");
      } catch (error) {
        logger.error("❌ Failed to save to tab", { error });
      }
    },
    [attachments, saveFilesToTab, t],
  );
  const removeAttachment = useCallback(
    async (id: string) => {
      const updatedAttachments = attachments.filter(
        (attachment) => attachment.id !== id,
      );
      setAttachments(updatedAttachments);

      // 保存到tab
      await saveFilesToTab(updatedAttachments);
    },
    [attachments, saveFilesToTab],
  );

  const clearAttachments = useCallback(async () => {
    setAttachments([]);

    // 清空tab中的文件
    await saveFilesToTab([]);
  }, [saveFilesToTab]);

  // 直接设置附件（用于编辑模式）
  const setAttachmentsDirectly = useCallback(
    (newAttachments: AttachmentFile[]) => {
      setAttachments(newAttachments);
    },
    [],
  );

  return {
    attachments,
    addAttachments,
    removeAttachment,
    clearAttachments,
    loadFilesFromTab,
    setAttachmentsDirectly,
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
