import { Button } from "@renderer/components/ui/button";
import logger from "@shared/logger/renderer-logger";
import type { Attachment } from "@shared/triplit/types";
import { Download, ExternalLink, File, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DefaultPreviewProps {
  attachment: Attachment;
  onClose: () => void;
}

export default function DefaultPreview({
  attachment,
  onClose,
}: DefaultPreviewProps) {
  const { t } = useTranslation("translation", { keyPrefix: "preview" });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

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

  return (
    <div className="relative flex h-full flex-col" onContextMenu={handleContextMenu} role="dialog" tabIndex={-1}>
      {/* Close button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          size="sm"
          intent="secondary"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex h-full items-center justify-center">
        <div className="max-w-md space-y-6 text-center">
          <File className="mx-auto h-20 w-20 text-muted-fg" />

          <div className="space-y-2">
            <h3
              className="truncate font-medium text-lg"
              title={attachment.name}
            >
              {attachment.name}
            </h3>
            <div className="space-y-1 text-muted-fg text-sm">
              <p>Size: {formatFileSize(attachment.size)}</p>
              <p>Type: {attachment.type}</p>
            </div>
          </div>

          <div className="text-muted-fg text-sm">
            {t("file-preview-not-supported")}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleExternalPreview} intent="primary">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("open-external")}
            </Button>
            <Button onClick={handleDownload} intent="secondary">
              <Download className="mr-2 h-4 w-4" />
              {t("download")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
