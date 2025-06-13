import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { cn } from "@renderer/lib/utils";
import {
  File,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

interface MessageAttachmentsProps {
  attachments: AttachmentFile[];
  className?: string;
}

export function MessageAttachments({
  attachments,
  className,
}: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getFileIcon = (attachment: AttachmentFile) => {
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
              <div className="relative overflow-hidden rounded-lg">
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
              </div>
            ) : (
              // 非图片文件 - 气泡内样式
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg p-2",
                  "border border-border bg-muted/50",
                )}
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
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }


