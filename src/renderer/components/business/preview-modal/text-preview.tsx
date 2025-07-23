import { Button } from "@renderer/components/ui/button";
import logger from "@shared/logger/renderer-logger";
import type { Attachment } from "@shared/triplit/types";
import {
  Copy,
  Download,
  ExternalLink,
  FileText,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
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
  const [contentHeight, setContentHeight] = useState(400); // Default height while calculating
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Calculate content area height
  useEffect(() => {
    const calculateHeight = () => {
      // Wait for DOM to be ready
      setTimeout(() => {
        const modalHeight = window.innerHeight * 0.9; // Modal max height is 90vh
        const headerHeight = headerRef.current?.offsetHeight || 80; // Default header height
        const footerHeight = footerRef.current?.offsetHeight || 40; // Default footer height
        const availableHeight = modalHeight - headerHeight - footerHeight - 16; // Extra padding
        setContentHeight(Math.max(availableHeight, 300)); // Minimum 300px
      }, 0);
    };

    calculateHeight();
    
    // Recalculate when header/footer resize
    const resizeObserver = new ResizeObserver(calculateHeight);
    if (headerRef.current) resizeObserver.observe(headerRef.current);
    if (footerRef.current) resizeObserver.observe(footerRef.current);
    
    window.addEventListener('resize', calculateHeight);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateHeight);
    };
  }, []);

  const loadTextContent = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // First, check if we have pre-processed content
      if (attachment.fileContent) {
        setContent(attachment.fileContent);
        return;
      }

      // Try to get parsed content from the file processing service
      try {
        const parsedContent = await window.service.fileParseService.parseFileContent({
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
            // Handle data URL format: "data:text/plain;base64,SGVsbG8gV29ybGQ="
            const base64Data = attachment.fileData.split(",")[1] || attachment.fileData;
            const decoded = atob(base64Data);
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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    toast.success(t("copied-to-clipboard"));
  }, [content, t]);

  const handleExternalOpen = async () => {
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
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleCopy]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-background">
        <div className="text-muted-fg">{t("loading-text")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center bg-background">
        <FileText className="mb-2 h-12 w-12 text-muted-fg" />
        <div className="text-muted-fg">{error}</div>
        <Button size="sm" intent="secondary" onClick={onClose} className="mt-4">
          {t("close")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col bg-background"
      onContextMenu={handleContextMenu}
      role="dialog"
      tabIndex={-1}
      aria-label={`${t("text-preview")}: ${attachment.name}`}
    >
      {/* Header */}
      <div ref={headerRef} className="border-border border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-fg" />
            <div>
              <div className="font-medium">{attachment.name}</div>
              <div className="text-muted-fg text-sm">
                {formatFileSize((attachment.fileData || '').length)} • {t("text-file")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              intent="secondary"
              onClick={handleCopy}
              aria-label={t("copy-content")}
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              intent="secondary"
              onClick={handleExternalOpen}
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
      </div>

      {/* Text content */}
      <div
        className="overflow-auto bg-background p-4"
        style={{ height: contentHeight }}
      >
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {content}
        </pre>
      </div>

      {/* Help text */}
      <div ref={footerRef} className="border-border border-t bg-background px-4 py-2 text-center text-muted-fg text-xs">
        {t("help-text.text")}
      </div>
    </div>
  );
}