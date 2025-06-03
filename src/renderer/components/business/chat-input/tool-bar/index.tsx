import { Button } from "@renderer/components/ui/button";
import { Separator } from "@renderer/components/ui/separator";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { cn } from "@renderer/lib/utils";
import { useTranslation } from "react-i18next";
import { FaCircleArrowUp } from "react-icons/fa6";
import { toast } from "sonner";
import { AttachmentUploader } from "./attachment-uploader";
import { ModelSelect } from "./model-select";

interface ToolBarProps {
  className?: string;
}

export function ToolBar({ className }: ToolBarProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });
  const {
    selectedProviderId,
    selectedModelId,
    handleModelSelect,
    handleSendMessage,
  } = useToolBar();

  const canSendMessage = selectedProviderId && selectedModelId;

  const handleSendMessageClick = () => {
    if (!canSendMessage) {
      const msg = selectedProviderId ? t("lack-model") : t("lack-provider");
      toast.error(msg);
      return;
    }

    handleSendMessage();
  };

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

        <div className="flex flex-row items-center gap-x-2">
          <ModelSelect
            onSelect={handleModelSelect}
            selectedModelId={selectedModelId}
          />

          <Separator className="h-1/2 w-[2px]" orientation="vertical" />

          <Button
            intent="plain"
            size="square-petite"
            shape="circle"
            onClick={handleSendMessageClick}
          >
            <FaCircleArrowUp className="size-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
