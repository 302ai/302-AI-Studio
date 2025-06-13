import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { ALLOWED_TYPES } from "@renderer/hooks/use-attachments";
import { Paperclip } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface AttachmentUploaderProps {
  onFilesSelect: (files: FileList) => void;
}

export function AttachmentUploader({ onFilesSelect }: AttachmentUploaderProps) {
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
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

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          className="size-8"
          intent="plain"
          size="square-petite"
          onClick={handleClick}
        >
          <Paperclip className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          <span>{t("chat.tool-bar.attach-file")}</span>
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
