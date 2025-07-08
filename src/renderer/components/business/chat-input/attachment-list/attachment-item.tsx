import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { cn } from "@renderer/lib/utils";
import {
  Eye,
  File,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import logger from "@shared/logger/renderer-logger";

interface AttachmentItemProps {
  attachment: AttachmentFile;
  onRemove: (id: string) => void;
}

const { filePreviewService } = window.service;

export function AttachmentItem({ attachment, onRemove }: AttachmentItemProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handlePreview = async () => {
    try {
      if (attachment.filePath) {
        const result = await filePreviewService.previewFileByPath(
          attachment.filePath,
        );
        if (!result.success) {
          toast.error(t(result.error || "file-preview-failed"));
        }
      }
    } catch (error) {
      logger.error("AttachmentItem: Error calling preview service", { error });
    }
  };

  const getFileIcon = () => {
    const { type, name } = attachment;
    const iconClass = "size-6";
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
    <div className="group relative">
      <div
        className={cn(
          "relative size-14 overflow-hidden rounded-lg",
          "flex items-center justify-center",
          !attachment.preview && "border border-border bg-muted/50",
        )}
      >
        {/* File preview or icon + filename */}
        {attachment.preview ? (
          <img
            src={attachment.preview}
            alt={attachment.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-y-1 px-0.5 text-muted-fg">
            <span>{getFileIcon()}</span>
            <span className="max-w-full truncate text-xs leading-none">
              {attachment.name}
            </span>
          </div>
        )}

        {/* Full overlay with preview icon and file size - only show on hover */}
        <div
          className={cn(
            "absolute inset-0 bg-black/70 text-white",
            "flex flex-col items-center justify-center",
            "opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          )}
        >
          {/* Preview icon in center */}

          <Eye className="size-4 cursor-pointer" onClick={handlePreview} />

          {/* File size at bottom */}
          <div className="absolute right-0 bottom-0 left-0 px-1.5 py-0.5 text-center font-medium text-xs">
            {formatFileSize(attachment.size)}
          </div>
        </div>
        {/* Remove button */}
        <Trash2
          className="absolute top-0 right-0 size-4 cursor-pointer text-destructive opacity-0 group-hover:opacity-100"
          onClick={() => onRemove(attachment.id)}
        />
      </div>
    </div>
  );
}
