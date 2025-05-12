import { Button } from "../../ui/button";
import { AttachmentUploader } from "./attachment-uploader";
import { cn } from "@/src/renderer/lib/utils";
import { FaCircleArrowUp } from "react-icons/fa6";

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
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-row items-center gap-x-2">
          <AttachmentUploader />
        </div>

        <Button intent="plain" size="square-petite" shape="circle">
          <FaCircleArrowUp className="size-8" />
        </Button>
      </div>
    </div>
  );
}
