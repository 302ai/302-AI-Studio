import { ArrowUpCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@renderer/components/ui/button";
import { Separator } from "@renderer/components/ui/separator";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { cn } from "@renderer/lib/utils";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AttachmentUploader } from "./attachment-uploader";
import { ModelSelect } from "./model-select";

interface ToolBarProps {
  className?: string;
  onFilesSelect: (files: FileList) => void;
  attachments: AttachmentFile[];
  input: string;
  onSendMessage: () => Promise<void>;
  selectedProviderId: string;
  selectedModelId: string;
  onModelSelect: (providerId: string, modelId: string) => Promise<void>;
}

export function ToolBar({
  className,
  onFilesSelect,
  onSendMessage,
  selectedProviderId,
  selectedModelId,
  onModelSelect,
}: ToolBarProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });

  const canSendMessage = selectedProviderId && selectedModelId;

  const handleSendMessageClick = async () => {
    if (!canSendMessage) {
      const msg = selectedProviderId ? t("lack-model") : t("lack-provider");
      toast.error(msg);
      return;
    }

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
        <div className="flex flex-row items-center gap-x-2">
          <AttachmentUploader onFilesSelect={onFilesSelect} />
        </div>

        <div className="flex flex-row items-center gap-x-2">
          <ModelSelect
            onSelect={onModelSelect}
            selectedModelId={selectedModelId}
          />

          <Separator className="h-1/2 w-[2px]" orientation="vertical" />

          <Button
            intent="plain"
            size="square-petite"
            shape="circle"
            onClick={handleSendMessageClick}
          >
            <ArrowUpCircleIcon className="!size-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
