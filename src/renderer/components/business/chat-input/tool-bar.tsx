import { Button } from "@renderer/components/ui/button";
import { AttachmentUploader } from "./tools/attachment-uploader";
import { cn } from "@renderer/lib/utils";
import { FaCircleArrowUp } from "react-icons/fa6";
import { useToolBar } from "@renderer/hooks/use-tool-bar";

interface ToolBarProps {
  className?: string;
}

export function ToolBar({ className }: ToolBarProps) {
  const { handleSendMessage } = useToolBar();

  return (
    <div
      className={cn(
        "flex h-[var(--chat-input-toolbar-height)] flex-row items-center justify-between",
        className
      )}
    >
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-row items-center gap-x-2">
          <AttachmentUploader />
        </div>

        <Button
          intent="plain"
          size="square-petite"
          shape="circle"
          onClick={handleSendMessage}
        >
          <FaCircleArrowUp className="size-8" />
        </Button>
      </div>
    </div>
  );
}
