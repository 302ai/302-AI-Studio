import { Button } from "@renderer/components/ui/button";
import logger from "@shared/logger/renderer-logger";
import type { Attachment } from "@shared/triplit/types";
import {
  Copy,
  Download,
  ExternalLink,
  FileText,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface TextPreviewProps {
  attachment: Attachment;
  onClose: () => void;
}

export default function TextPreview({ attachment, onClose }: TextPreviewProps) {
  const { t } = useTranslation("translation", { keyPrefix: "preview" });
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [scale, setScale] = useState(1);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const loadTextContent = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Try to get parsed content from the file processing service
      try {
        const parsedContent =
          await window.service.fileParseService.parseFileContent({
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            fileData: attachment.fileData || "",
          });
        setContent(parsedContent);
      } catch (parseError) {
        // Fallback to base64 decode if available
        if (attachment.fileData) {
          try {
            const decoded = atob(
              attachment.fileData.split(",")[1] || attachment.fileData,
            );
            setContent(decoded);
          } catch (decodeError) {
            logger.error("Failed to decode file data", { decodeError });
            setError(t("failed-to-decode"));
          }
        } else {
          logger.error("No file data available", { parseError });
          setError(t("no-content-available"));
        }
      }
    } catch (err) {
      logger.error("Failed to load text content", { err });
      setError(t("failed-to-load"));
    } finally {
      setLoading(false);
    }
  }, [attachment, t]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(t("content-copied"));
    } catch (error) {
      logger.error("Failed to copy to clipboard", { error });
      toast.error(t("copy-failed"));
    }
  }, [content, t]);

  const handleExternalPreview = async () => {
    try {
      if (attachment.filePath) {
        await window.service.filePreviewService.previewFileByPath(
          attachment.filePath,
        );
      }
    } catch (error) {
      logger.error("Failed to open external preview", { error });
    }
  };

  const handleDownload = async () => {
    if (attachment.filePath) {
      try {
        await window.service.filePreviewService.previewFileByPath(
          attachment.filePath,
        );
      } catch (error) {
        logger.error("Failed to download file", { error });
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    loadTextContent();
  }, [loadTextContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        handleCopy();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        setScale(1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleCopy, handleZoomIn, handleZoomOut]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-fg" />
          <div className="text-muted-fg">{t("loading-text")}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md space-y-4 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-fg" />
          <div className="text-muted-fg">{error}</div>
          <Button onClick={handleExternalPreview} intent="primary">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("open-external")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" onContextMenu={handleContextMenu} role="dialog" tabIndex={-1}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-border border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-fg" />
          <span className="max-w-40 truncate" title={attachment.name}>
            {attachment.name}
          </span>
          <span className="text-muted-fg">
            ({formatFileSize(attachment.size)})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            intent="secondary"
            onClick={handleZoomOut}
            isDisabled={scale <= 0.5}
            aria-label={t("zoom-out")}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <span className="min-w-16 text-center text-sm">
            {Math.round(scale * 100)}%
          </span>

          <Button
            size="sm"
            intent="secondary"
            onClick={handleZoomIn}
            isDisabled={scale >= 3}
            aria-label={t("zoom-in")}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            size="sm"
            intent="secondary"
            onClick={handleCopy}
            aria-label={t("copy-text")}
          >
            <Copy className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            intent="secondary"
            onClick={handleExternalPreview}
            aria-label={t("open-external")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            intent="secondary"
            onClick={handleDownload}
            aria-label={t("download")}
          >
            <Download className="h-4 w-4" />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            size="sm"
            intent="secondary"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 overflow-auto bg-background">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            minHeight: `${100 / scale}%`,
            minWidth: `${100 / scale}%`,
          }}
        >
          <div className="whitespace-pre-wrap p-4 font-mono text-sm">
            {content}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="border-border border-t bg-background px-4 py-2 text-center text-muted-fg text-xs">
        {t("help-text.text")}
      </div>
    </div>
  );
}
