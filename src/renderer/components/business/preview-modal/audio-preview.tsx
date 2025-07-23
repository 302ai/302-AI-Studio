import { Button } from "@renderer/components/ui/button";
import logger from "@shared/logger/renderer-logger";
import type { Attachment } from "@shared/triplit/types";
import {
  Download,
  ExternalLink,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface AudioPreviewProps {
  attachment: Attachment;
  onClose: () => void;
}

export default function AudioPreview({
  attachment,
  onClose,
}: AudioPreviewProps) {
  const { t } = useTranslation("translation", { keyPrefix: "preview" });
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, percentage));

    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMute = useCallback(() => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleSkipForward = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(currentTime + 10, duration);
  }, [currentTime, duration]);

  const handleSkipBackward = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(currentTime - 10, 0);
  }, [currentTime]);

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
        logger.error("Failed to download audio", { error });
      }
    }
  };

  const setupAudioElement = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError(t("failed-to-load"));
      setLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [t]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    return setupAudioElement();
  }, [setupAudioElement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSkipBackward();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSkipForward();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleMute();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    onClose,
    handlePlayPause,
    handleSkipBackward,
    handleSkipForward,
    handleMute,
  ]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md space-y-4 text-center">
          <Music className="mx-auto h-12 w-12 text-muted-fg" />
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
      {/* Header */}
      <div className="flex items-center justify-between border-border border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Music className="h-4 w-4 text-muted-fg" />
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

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={
          attachment.fileData ||
          `data:${attachment.type};base64,${attachment.fileData}`
        }
        preload="metadata"
        className="hidden"
      >
        <track kind="captions" />
      </audio>

      {/* Player UI */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-8">
        {loading ? (
          <div className="text-center">
            <Music className="mx-auto mb-4 h-16 w-16 animate-pulse text-muted-fg" />
            <div className="text-muted-fg">{t("loading-audio")}</div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6">
            {/* Album Art Placeholder */}
            <div className="mx-auto flex aspect-square w-48 items-center justify-center rounded-lg border bg-muted/50">
              <Music className="h-16 w-16 text-muted-fg" />
            </div>

            {/* Track Info */}
            <div className="space-y-1 text-center">
              <h3
                className="truncate font-medium text-lg"
                title={attachment.name}
              >
                {attachment.name.replace(/\.[^/.]+$/, "")}
              </h3>
              <p className="text-muted-fg text-sm">
                {formatFileSize(attachment.size)} •{" "}
                {attachment.type.split("/")[1].toUpperCase()}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div
                className="relative h-2 cursor-pointer rounded-full bg-muted"
                onClick={handleSeek}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSeek(
                      e as unknown as React.MouseEvent<HTMLDivElement>,
                    );
                  }
                }}
                role="slider"
                tabIndex={0}
                aria-label={t("help-text.audio")}
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-100"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div
                  className="-translate-y-1/2 absolute top-1/2 h-3 w-3 rounded-full border-2 border-background bg-primary shadow-sm transition-all duration-100"
                  style={{
                    left: `calc(${(currentTime / duration) * 100}% - 6px)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-muted-fg text-xs">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="sm"
                intent="secondary"
                onClick={handleSkipBackward}
                aria-label={t("help-text.audio")}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="lg"
                intent="primary"
                onClick={handlePlayPause}
                aria-label={isPlaying ? t("help-text.audio") : t("help-text.audio")}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" />
                )}
              </Button>

              <Button
                size="sm"
                intent="secondary"
                onClick={handleSkipForward}
                aria-label={t("help-text.audio")}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                intent="secondary"
                onClick={handleMute}
                aria-label={isMuted ? t("help-text.audio") : t("help-text.audio")}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <div
                className="relative h-1 flex-1 cursor-pointer rounded-full bg-muted"
                onClick={handleVolumeChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleVolumeChange(
                      e as unknown as React.MouseEvent<HTMLDivElement>,
                    );
                  }
                }}
                role="slider"
                tabIndex={0}
                aria-label={t("help-text.audio")}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={isMuted ? 0 : volume}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-100"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>

              <span className="w-8 text-right text-muted-fg text-xs">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="border-border border-t bg-background px-4 py-2 text-center text-muted-fg text-xs">
        {t("help-text.audio")}
      </div>
    </div>
  );
}
