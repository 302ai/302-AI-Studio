import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@renderer/components/ui/tooltip";
import { IconPaperclip3 } from "@intentui/icons";
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
        <IconPaperclip3 className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent>
        <span>{t("chat.tool-bar.attach-file")}</span>
      </TooltipContent>
    </Tooltip>
  );
}
