import { Button } from "@renderer/components/ui/button";

import { cn } from "@renderer/lib/utils";
import type { Attachment } from "@shared/triplit/types";
import {
  Download,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ImagePreviewProps {
  attachment: Attachment;
  onClose: () => void;
}

export default function ImagePreview({
  attachment,
  onClose,
}: ImagePreviewProps) {
  const { t } = useTranslation("translation", { keyPrefix: "preview" });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation((prev) => prev - 90);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation((prev) => prev + 90);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, scale],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleDownload = async () => {
    if (attachment.filePath) {
      try {
        await window.service.filePreviewService.previewFileByPath(
          attachment.filePath,
        );
      } catch (error) {
        console.error("Failed to download image:", error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRotateLeft();
        } else {
          handleRotateRight();
        }
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetTransform();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    onClose,
    resetTransform,
    handleRotateLeft,
    handleRotateRight,
    handleZoomIn,
    handleZoomOut,
  ]);

  return (
    <div className="relative flex h-full flex-col bg-overlay/95 backdrop-blur-sm" onContextMenu={handleContextMenu} role="dialog" tabIndex={-1}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-border border-b bg-overlay/50 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-overlay-fg text-sm">
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
            className="!p-0 size-8"
            onClick={handleZoomOut}
            isDisabled={scale <= 0.1}
            aria-label={t("zoom-out")}
          >
            <ZoomOut size={18} />
          </Button>

          <span className="min-w-16 text-center text-overlay-fg text-sm">
            {Math.round(scale * 100)}%
          </span>

          <Button
            size="sm"
            intent="secondary"
            className="!p-0 size-8"
            onClick={handleZoomIn}
            isDisabled={scale >= 5}
            aria-label={t("zoom-in")}
          >
            <ZoomIn size={18} />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            size="sm"
            intent="secondary"
            className="!p-0 size-8"
            onClick={handleRotateLeft}
            aria-label={t("rotate-left")}
          >
            <RotateCcw size={18} />
          </Button>

          <Button
            size="sm"
            intent="secondary"
            className="!p-0 size-8"
            onClick={handleRotateRight}
            aria-label={t("rotate-right")}
          >
            <RotateCw size={18} />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            size="sm"
            intent="secondary"
            className="!p-0 size-8"
            onClick={resetTransform}
            aria-label={t("reset-zoom")}
          >
            1:1
          </Button>

          <Button
            size="sm"
            intent="secondary"
            className="!p-0 size-8"
            onClick={handleDownload}
            aria-label={t("download")}
          >
            <Download size={18} />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            size="sm"
            intent="secondary"
            className="!p-0 size-8"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className={cn(
          "flex flex-1 items-center justify-center overflow-hidden",
          isDragging && "cursor-grabbing",
          scale > 1 && !isDragging && "cursor-grab",
        )}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={
            attachment.preview ||
            `data:${attachment.type};base64,${attachment.fileData}`
          }
          alt={attachment.name}
          className={cn(
            "max-h-full max-w-full object-contain transition-transform duration-100",
            !imageLoaded && "opacity-0",
          )}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={handleMouseDown}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-fg">{t("loading-image")}</div>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="bg-overlay/30 px-4 py-2 text-center text-muted-fg text-xs backdrop-blur-sm">
        {t("help-text.image")}
      </div>
    </div>
  );
}
