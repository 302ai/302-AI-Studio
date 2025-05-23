import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AttachmentUploader() {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger
        className="size-9"
        intent="plain"
        size="square-petite"
        onClick={() => {}}
      >
        <Paperclip className="size-4" />
      </TooltipTrigger>
      <TooltipContent>
        <span>{t("chat.tool-bar.attach-file")}</span>
      </TooltipContent>
    </Tooltip>
  );
}
