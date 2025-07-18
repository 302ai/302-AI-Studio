import { triplitClient } from "@renderer/client";
import { Button } from "@renderer/components/ui/button";
import { cn } from "@renderer/lib/utils";
import logger from "@shared/logger/renderer-logger";
import type { Attachment } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import {
  File,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface MessageAttachmentsProps {
  messageId: string;
  className?: string;
}

const { filePreviewService } = window.service;

export function MessageAttachments({
  messageId,
  className,
}: MessageAttachmentsProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });

  const attachmentsQuery = triplitClient
    .query("attachments")
    .Where("messageId", "=", messageId);
  const { results: attachments } = useQuery(triplitClient, attachmentsQuery);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handlePreview = async (attachment: Attachment) => {
    try {
      // 优先使用文件路径直接打开
      if (attachment.filePath) {
        const result = await filePreviewService.previewFileByPath(
          attachment.filePath,
        );
        if (!result.success) {
          logger.error("Failed to preview file by path", {
            error: result.error,
          });
          toast.error(t(result.error || "file-preview-failed"));
        }
      }
    } catch (error) {
      logger.error("Error calling preview service:", { error });
    }
  };

  const getFileIcon = (attachment: Attachment) => {
    const { type, name } = attachment;
    const iconClass = "size-4";

    // Image files
    if (type.startsWith("image/")) {
      return <FileImage className={iconClass} />;
    }

    // Audio files
    if (type.startsWith("audio/")) {
      return <FileAudio className={iconClass} />;
    }

    // JSON files
    if (type.includes("json")) {
      return <FileJson className={iconClass} />;
    }

    // JavaScript/TypeScript files
    if (
      type.includes("javascript") ||
      type.includes("typescript") ||
      name.endsWith(".js") ||
      name.endsWith(".ts") ||
      name.endsWith(".tsx") ||
      name.endsWith(".jsx")
    ) {
      return <FileCode className={iconClass} />;
    }

    // Excel/Spreadsheet files
    if (
      type.includes("excel") ||
      type.includes("spreadsheet") ||
      type.includes("csv") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      name.endsWith(".csv")
    ) {
      return <FileSpreadsheet className={iconClass} />;
    }

    // Text files and others
    if (
      type.startsWith("text/") ||
      type.includes("yaml") ||
      type.includes("xml") ||
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      name.endsWith(".yml") ||
      name.endsWith(".yaml")
    ) {
      return <FileText className={iconClass} />;
    }

    // Default file icon
    return <File className={iconClass} />;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {attachments.map((attachment) => (
        <div key={attachment.id} className="group relative">
          {attachment.type.startsWith("image/") && attachment.preview ? (
            // 图片预览 - 气泡内样式
            <Button
              intent="plain"
              className="hover:!bg-transparent !h-auto !w-auto !px-0 !py-0 relative cursor-pointer overflow-hidden rounded-lg border-0 bg-transparent p-0 transition-opacity [--btn-overlay:transparent]"
              onClick={() => handlePreview(attachment)}
              aria-label={`Preview image ${attachment.name}`}
            >
              <img
                src={attachment.preview}
                alt={attachment.name}
                className="h-auto max-h-60 w-full rounded-lg object-cover"
              />
              {/* 图片信息覆盖层 */}
              <div className="absolute right-0 bottom-0 left-0 bg-black/60 px-2 py-1 backdrop-blur-sm">
                <div className="flex items-center gap-1 text-white text-xs">
                  <span className="truncate">{attachment.name}</span>
                  <span>({formatFileSize(attachment.size)})</span>
                </div>
              </div>
            </Button>
          ) : (
            // 非图片文件 - 气泡内样式
            <Button
              className={cn(
                "flex w-full items-center gap-2 rounded-lg p-2 text-left",
                "border border-border bg-muted/50",
                "hover:!bg-muted/50 hover:!shadow-none cursor-pointer transition-colors",
              )}
              onClick={() => handlePreview(attachment)}
              aria-label={`Preview file ${attachment.name}`}
              intent="plain"
            >
              {getFileIcon(attachment)}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-sm">
                  {attachment.name}
                </div>
                <div className="text-xs opacity-70">
                  {formatFileSize(attachment.size)}
                </div>
              </div>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
