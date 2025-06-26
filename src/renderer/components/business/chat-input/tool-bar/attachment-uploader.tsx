import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { ALLOWED_TYPES } from "@renderer/hooks/use-attachments";
import { Atom, Globe, Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface AttachmentUploaderProps {
  onFilesSelect: (files: FileList) => void;
}

export function AttachmentUploader({ onFilesSelect }: AttachmentUploaderProps) {
  const { t } = useTranslation();
  const [isThinkingActive, setIsThinkingActive] = useState(false);
  const [isOnlineActive, setIsOnlineActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelect(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = "";
  };

  const handleOnLineSearch = () => {
    setIsOnlineActive(!isOnlineActive);
    console.log("handleOnLineSearch", !isOnlineActive);
  };

  const handleThinking = () => {
    setIsThinkingActive(!isThinkingActive);
    console.log("handleThinking", !isThinkingActive);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          className="size-8"
          intent="plain"
          size="square-petite"
          onClick={handleAttachFile}
        >
          <Paperclip className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          <span>{t("chat.tool-bar.attach-file")}</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          className={`size-8 ${isThinkingActive ? "bg-primary/15 text-primary" : ""}`}
          intent="plain"
          size="square-petite"
          onClick={handleThinking}
        >
          <Atom className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          <span>{t("chat.tool-bar.thinking")}</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          className={`size-8 ${isOnlineActive ? "bg-primary/15 text-primary" : ""}`}
          intent="plain"
          size="square-petite"
          onClick={handleOnLineSearch}
        >
          <Globe className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          <span>{t("chat.tool-bar.online-search")}</span>
        </TooltipContent>
      </Tooltip>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
      />
    </>
  );
}
