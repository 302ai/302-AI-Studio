import { Button } from "@renderer/components/ui/button";
import { cn } from "@renderer/lib/utils";
import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ShortcutRecorderProps {
  value?: string[];
  onValueChange: (keys: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ShortcutRecorder({
  value = [],
  onValueChange,
  placeholder = "Click to set shortcut",
  className,
}: ShortcutRecorderProps) {
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
  }, [isRecording, recordedKeys, onValueChange]);

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
    setIsRecording(true);
    setRecordedKeys([]);
  };

  const handleReset = () => {
    onValueChange([]);
  };

  const formatKeys = (keys: string[]) => {
    return keys.join(" + ");
  };

  const displayValue = isRecording
    ? recordedKeys.length > 0
      ? formatKeys(recordedKeys)
      : "Press keys..."
    : value.length > 0
      ? formatKeys(value)
      : placeholder;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={startRecording}
        className={cn(
          "flex h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isRecording && "ring-1 ring-ring",
          value.length === 0 && "text-muted-foreground",
        )}
        disabled={isRecording}
      >
        {displayValue}
      </button>

      {value.length > 0 && !isRecording && (
        <Button
          type="button"
          intent="outline"
          size="small"
          onClick={handleReset}
          className="h-9 px-2"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
