import plane from "@renderer/assets/images/plane.svg?url";
import { triplitClient } from "@renderer/client";
import { Button } from "@renderer/components/ui/button";
import { Separator } from "@renderer/components/ui/separator";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { useGlobalShortcutHandler } from "@renderer/hooks/use-global-shortcut-handler";
import { cn } from "@renderer/lib/utils";
import { useQueryOne } from "@triplit/react";
import { useCallback } from "react";
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
  const providerQuery = triplitClient
    .query("models")
    .Where("enabled", "=", true)
    .Where("id", "=", selectedModelId)
    .Include("provider");
  const { result: provider } = useQueryOne(triplitClient, providerQuery);
  const disabled = provider?.provider?.apiType !== "302ai";

  const handleSendMessageClick = useCallback(async () => {
    if (isDisabled) return;
    setEditMessageId(null);
    await onSendMessage();
  }, [isDisabled, setEditMessageId, onSendMessage]);

  const handleSendMessageShortcut = useCallback(() => {
    if (!isDisabled) {
      handleSendMessageClick();
    }
  }, [isDisabled, handleSendMessageClick]);

  //! TODO: 待迁移
  useGlobalShortcutHandler("send-message", handleSendMessageShortcut);

  return (
    <div
      className={cn(
        "flex h-[var(--chat-input-toolbar-height)] flex-row items-center justify-between",
        className,
      )}
    >
      <div className="flex w-full flex-row justify-between">
        <ActionGroup onFilesSelect={onFilesSelect} disabled={disabled} />

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
