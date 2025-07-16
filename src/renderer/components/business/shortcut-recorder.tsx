import { formatShortcutKeys } from "@renderer/config/constant";
import { cn } from "@renderer/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface ShortcutRecorderProps {
  value?: string[];
  onValueChange: (keys: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
  allShortcuts?: { action: string; keys: string[] }[];
  onReset?: () => void;
}

const checkShortcutConflict = (
  keys: string[],
  allShortcuts: { action: string; keys: string[] }[] = [],
): boolean => {
  const currentKeysStr = keys.slice().sort().join(",");
  return allShortcuts.some((shortcut) => {
    const existingKeysStr = shortcut.keys.slice().sort().join(",");
    return existingKeysStr === currentKeysStr;
  });
};

const hasModifierKey = (keys: string[]): boolean => {
  const modifierKeys = ["Ctrl", "Cmd", "Alt", "Shift"];
  return keys.some((key) => modifierKeys.includes(key));
};

export function ShortcutRecorder({
  value = [],
  onValueChange,
  placeholder,
  className,
  disabled = false,
  onRecordingChange,
  allShortcuts = [],
  onReset,
}: ShortcutRecorderProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.shortcuts-settings.recorder",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isRecording) return;

      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Backspace") {
        setIsRecording(false);
        setCurrentKeys([]);
        onRecordingChange?.(false);
        return;
      }

      const newKeys: string[] = [];

      if (event.ctrlKey) newKeys.push("Ctrl");
      if (event.metaKey) newKeys.push("Cmd");
      if (event.altKey) newKeys.push("Alt");
      if (event.shiftKey) newKeys.push("Shift");

      if (
        event.key &&
        !["Control", "Meta", "Shift", "Alt"].includes(event.key)
      ) {
        let keyToAdd = event.key;

        if (keyToAdd.length === 1) {
          keyToAdd = keyToAdd.toUpperCase();
        }

        newKeys.push(keyToAdd);
      }

      setCurrentKeys(newKeys);
    },
    [isRecording, onRecordingChange],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!isRecording) return;

      event.preventDefault();
      event.stopPropagation();

      const newKeys: string[] = [];

      if (event.ctrlKey) newKeys.push("Ctrl");
      if (event.metaKey) newKeys.push("Cmd");
      if (event.altKey) newKeys.push("Alt");
      if (event.shiftKey) newKeys.push("Shift");

      if (
        event.key &&
        !["Control", "Meta", "Shift", "Alt"].includes(event.key)
      ) {
        if (currentKeys.length > 0) {
          if (!hasModifierKey(currentKeys)) {
            toast.error(t("error.modifier-required"));
            setCurrentKeys([]);
            return;
          }

          if (checkShortcutConflict(currentKeys, allShortcuts)) {
            toast.error(t("error.shortcut-conflict"));
            setCurrentKeys([]);
            return;
          }

          setIsRecording(false);
          onValueChange(currentKeys);
          setCurrentKeys([]);
          onRecordingChange?.(false);
          return;
        }
      }

      setCurrentKeys(newKeys);
    },
    [
      isRecording,
      currentKeys,
      onValueChange,
      onRecordingChange,
      allShortcuts,
      t,
    ],
  );

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
    setCurrentKeys([]);
    onRecordingChange?.(true);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onValueChange([]);
    }
  };

  const handleCancel = () => {
    setIsRecording(false);
    setCurrentKeys([]);
    onRecordingChange?.(false);
  };

  const formatKeys = (keys: string[]) => {
    return formatShortcutKeys(keys);
  };

  const displayValue = isRecording
    ? currentKeys.length > 0
      ? formatKeys(currentKeys)
      : t("press-keys")
    : value.length > 0
      ? formatKeys(value)
      : placeholder || t("placeholder");

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          if (!isRecording && !disabled) {
            startRecording();
          }
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-[10px] border border-input bg-setting px-3 py-1 text-setting-fg text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          value.length === 0 && "text-muted-fg",
          disabled && "cursor-not-allowed opacity-50",
          isRecording && "border-primary ring-1 ring-ring",
          !isRecording && !disabled && "cursor-pointer",
        )}
        disabled={disabled}
      >
        <span className="flex-1 text-left">{displayValue}</span>

        {isRecording && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            className="ml-2 font-medium text-primary text-sm hover:text-primary/80"
          >
            {t("cancel")}
          </button>
        )}

        {!isRecording && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="ml-2 font-medium text-primary text-sm hover:text-primary/80"
          >
            {t("reset")}
          </button>
        )}
      </button>
    </div>
  );
}
