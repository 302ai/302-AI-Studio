import { AttachmentUploader } from "./attachment-uploader";
import { cn } from "@/src/renderer/lib/utils";

interface ToolBarProps {
  className?: string;
}

export function ToolBar({ className }: ToolBarProps) {
  return (
    <div
      className={cn(
        "flex h-[var(--chat-input-toolbar-height)] flex-row items-center justify-between",
        className,
      )}
    >
      <div className="flex flex-row items-center gap-x-2">
        <AttachmentUploader />
      </div>
    </div>
  );
}
