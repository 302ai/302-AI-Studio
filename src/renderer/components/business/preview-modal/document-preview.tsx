import { Button } from "@renderer/components/ui/button";
import logger from "@shared/logger/renderer-logger";
import type { Attachment } from "@shared/triplit/types";
import { Download, ExternalLink, FileText, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface DocumentPreviewProps {
  attachment: Attachment;
  onClose: () => void;
}

export default function DocumentPreview({
  attachment,
  onClose,
}: DocumentPreviewProps) {
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

  const loadDocumentContent = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // For PDF files, we'll try to get parsed content from the file processing service
      if (attachment.type === "application/pdf") {
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
          logger.warn("Failed to parse PDF content, showing raw text", {
            parseError,
          });
          setError(t("document-parsing-unavailable"));
        }
      } else {
        // For other document types (Word, PowerPoint), try to get parsed content
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
          logger.warn("Failed to parse document content", { parseError });
          setError(t("document-parsing-unavailable"));
        }
      }
    } catch (err) {
      logger.error("Failed to load document content", { err });
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
        logger.error("Failed to download document", { error });
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    loadDocumentContent();
  }, [loadDocumentContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [onClose, handleZoomIn, handleZoomOut]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-fg" />

          <div className="text-muted-fg">{t("loading-document")}</div>
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

      {/* Document content */}
      <div className="flex-1 overflow-auto bg-muted/10 dark:bg-overlay/20">
        <div
          className="mx-auto max-w-4xl p-6"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            minHeight: `${100 / scale}%`,
          }}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content.split("\n").map((line, index) => (
              <p
                key={`doc-line-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: e
                  index
                }`}
                className={line.trim() === "" ? "mb-2 h-4" : "mb-2"}
              >
                {line || "\u00A0"}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="border-border border-t bg-background px-4 py-2 text-center text-muted-fg text-xs">
        {t("help-text.document")}
      </div>
    </div>
  );
}
