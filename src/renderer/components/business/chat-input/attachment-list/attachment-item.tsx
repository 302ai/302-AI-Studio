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

interface AttachmentItemProps {
  attachment: AttachmentFile;
  onRemove: (id: string) => void;
}

export function AttachmentItem({ attachment, onRemove }: AttachmentItemProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handlePreview = async () => {
    console.log("Starting preview for file:", {
      name: attachment.name,
      type: attachment.type,
      hasPreview: !!attachment.preview,
      hasFileData: !!attachment.fileData,
      hasFile: !!attachment.file,
    });

    try {
      let fileData: string | undefined;

      if (attachment.type.startsWith("image/")) {
        // 处理图片文件
        fileData = attachment.preview;

        // 如果预览数据无效，尝试从原始文件重新生成
        if (!fileData || !fileData.startsWith("data:image/")) {
          console.log("Preview data is invalid, regenerating from file...");
          if (attachment.file) {
            try {
              fileData = await readFileAsDataURL(attachment.file);
              console.log("Regenerated preview data:", {
                length: fileData.length,
                start: fileData.substring(0, 100),
              });
            } catch (error) {
              console.error("Failed to regenerate preview:", error);
              return;
            }
          } else {
            console.error("No file available to regenerate preview");
            return;
          }
        }

        console.log("About to call main process with image:", {
          fileName: attachment.name,
          fileDataType: typeof fileData,
          fileDataLength: fileData?.length,
          fileDataStart: fileData?.substring(0, 100),
        });

        const result = await window.service.filePreviewService.previewImage(
          attachment.name,
          fileData
        );

        if (!result.success) {
          console.error("Failed to preview image:", result.error);
        }
      } else {
        // 处理非图片文件（包括音频文件）
        fileData = attachment.fileData;

        // 如果文件数据无效，尝试从原始文件重新生成
        if (!fileData && attachment.file) {
          console.log("File data not available, generating from file...");
          try {
            fileData = await readFileAsDataURL(attachment.file);
            console.log("Generated file data:", {
              length: fileData.length,
              start: fileData.substring(0, 100),
            });
          } catch (error) {
            console.error("Failed to generate file data:", error);
            return;
          }
        }

        if (!fileData) {
          console.error("No file data available for preview");
          return;
        }

        console.log("About to call main process with file:", {
          fileName: attachment.name,
          mimeType: attachment.type,
          fileDataType: typeof fileData,
          fileDataLength: fileData?.length,
          fileDataStart: fileData?.substring(0, 100),
        });

        const result = await window.service.filePreviewService.previewFile(
          attachment.name,
          fileData,
          attachment.type
        );

        if (!result.success) {
          console.error("Failed to preview file:", result.error);
        }
      }
    } catch (error) {
      console.error("Error calling preview service:", error);
    }
  };

  // 辅助函数：读取文件为 DataURL
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
