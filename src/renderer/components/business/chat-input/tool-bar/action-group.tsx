import { triplitClient } from "@renderer/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { ALLOWED_TYPES } from "@renderer/hooks/use-attachments";
import { cn } from "@renderer/lib/utils";
import { useQueryOne } from "@triplit/react";
import { Atom, Globe, Paperclip } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface ActionGroupProps {
  onFilesSelect: (files: FileList) => void;
}

const { settingsService } = window.service;

export function ActionGroup({ onFilesSelect }: ActionGroupProps) {
  const { t } = useTranslation();

  const settingsQuery = triplitClient.query("settings");
  const { result: settingsResult } = useQueryOne(triplitClient, settingsQuery);
  const enabledWebSearch = settingsResult?.enableWebSearch ?? false;
  const enabledReason = settingsResult?.enableReason ?? false;

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

  const handleWebSearch = async () => {
    await settingsService.setEnableWebSearch(!enabledWebSearch);
  };

  const handleReason = async () => {
    await settingsService.setEnableReason(!enabledReason);
  };

  return (
    <div className="flex flex-row items-center gap-x-2">
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
          className={cn(
            "size-8",
            enabledReason && "bg-primary/15 text-primary",
          )}
          intent="plain"
          size="square-petite"
          onClick={handleReason}
        >
          <Atom className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          <span>{t("chat.tool-bar.thinking")}</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          className={cn(
            "size-8",
            enabledWebSearch && "bg-primary/15 text-primary",
          )}
          intent="plain"
          size="square-petite"
          onClick={handleWebSearch}
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
    </div>
  );
}
