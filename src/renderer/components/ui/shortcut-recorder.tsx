import { ButtonWithTooltip } from "@renderer/components/business/button-with-tooltip";
import { Button } from "@renderer/components/ui/button";
import { cn } from "@renderer/lib/utils";
import { Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ShortcutRecorderProps {
  value?: string[];
  onValueChange: (keys: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
}

export function ShortcutRecorder({
  value = [],
  onValueChange,
  placeholder,
  className,
  disabled = false,
  onRecordingChange,
}: ShortcutRecorderProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.shortcuts-settings.recorder",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isRecording) return;

      event.preventDefault();
      event.stopPropagation();

      const keys: string[] = [];

      if (event.ctrlKey) keys.push("Ctrl");
      if (event.metaKey) keys.push("Cmd");
      if (event.shiftKey) keys.push("Shift");
      if (event.altKey) keys.push("Alt");
      if (
        event.key &&
        !["Control", "Meta", "Shift", "Alt"].includes(event.key)
      ) {
        keys.push(event.key.toUpperCase());
      }

      if (keys.length > 0) {
        setRecordedKeys(keys);
      }
    },
    [isRecording],
  );

  const handleKeyUp = useCallback(() => {
    if (!isRecording || recordedKeys.length === 0) return;

    setIsRecording(false);
    onValueChange(recordedKeys);
    setRecordedKeys([]);
    onRecordingChange?.(false);
  }, [isRecording, recordedKeys, onValueChange, onRecordingChange]);

  useEffect(() => {
    if (!isRecording) return;

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecording, handleKeyDown, handleKeyUp]);

  const startRecording = () => {
    if (disabled) return;
    setIsRecording(true);
    setRecordedKeys([]);
    onRecordingChange?.(true);
  };

  const handleReset = () => {
    onValueChange([]);
  };

  const handleCancel = () => {
    setIsRecording(false);
    setRecordedKeys([]);
    onRecordingChange?.(false);
  };

  const formatKeys = (keys: string[]) => {
    return keys.join(" + ");
  };

  const displayValue = isRecording
    ? recordedKeys.length > 0
      ? formatKeys(recordedKeys)
      : t("press-keys")
    : value.length > 0
      ? formatKeys(value)
      : placeholder || t("placeholder");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={startRecording}
        className={cn(
          "flex h-9 w-full items-center justify-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-fg",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isRecording && "ring-1 ring-ring",
          value.length === 0 && "text-muted-fg",
          disabled && "cursor-not-allowed opacity-50",
        )}
        disabled={isRecording || disabled}
      >
        {displayValue}
      </button>

      {(value.length > 0 || isRecording) &&
        (isRecording ? (
          <ButtonWithTooltip
            type="button"
            intent="outline"
            size="small"
            onClick={handleCancel}
            className="h-9 px-2"
            title={t("cancel")}
          >
            <X className="h-4 w-4" />
          </ButtonWithTooltip>
        ) : (
          <ButtonWithTooltip
            type="button"
            intent="outline"
            size="small"
            onClick={handleReset}
            className="h-9 px-2"
            title={t("clear")}
          >
            <Trash2 className="h-4 w-4" />
          </ButtonWithTooltip>
        ))}
    </div>
  );
}
