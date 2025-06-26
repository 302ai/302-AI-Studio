import plane from "@renderer/assets/images/plane.svg?url";
import { Button } from "@renderer/components/ui/button";
import { Separator } from "@renderer/components/ui/separator";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { cn } from "@renderer/lib/utils";
import { ActionGroup } from "./action-group";
import { ModelSelect } from "./model-select";

interface ToolBarProps {
  className?: string;
  onFilesSelect: (files: FileList) => void;
  attachments: AttachmentFile[];
  onSendMessage: () => Promise<void>;
  selectedModelId: string;
  onModelSelect: (modelId: string) => Promise<void>;
  isDisabled: boolean;
  setEditMessageId: (messageId: string | null) => void;
}

export function ToolBar({
  className,
  onFilesSelect,
  onSendMessage,
  selectedModelId,
  onModelSelect,
  isDisabled,
  setEditMessageId,
}: ToolBarProps) {
  const handleSendMessageClick = async () => {
    setEditMessageId(null);
    await onSendMessage();
  };

  return (
    <div
      className={cn(
        "flex h-[var(--chat-input-toolbar-height)] flex-row items-center justify-between",
        className,
      )}
    >
      <div className="flex w-full flex-row justify-between">
        <ActionGroup onFilesSelect={onFilesSelect} />

        <div className="flex flex-row items-center gap-x-2">
          <ModelSelect
            onSelect={onModelSelect}
            selectedModelId={selectedModelId}
          />

          <Separator className="h-1/2 w-[2px]" orientation="vertical" />
          {/* <Button
            intent="primary"
            size="square-petite"
            shape="circle"
            onClick={handleSendMessageClick}
            isDisabled={isDisabled}
            // className="!rounded-lg"
          >
            <Send className="!size-4" />
          </Button> */}
          <Button
            intent="outline"
            size="square-petite"
            shape="square"
            onClick={handleSendMessageClick}
            isDisabled={isDisabled}
            className="!rounded-[10px] !bg-primary !text-white"
          >
            <img src={plane} alt="plane" className="!size-5" />
            {/* <Send className="!size-4" /> */}
          </Button>
        </div>
      </div>
    </div>
  );
}
