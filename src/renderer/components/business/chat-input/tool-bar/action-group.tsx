import { triplitClient } from "@renderer/client";
import { ButtonWithTooltip } from "@renderer/components/business/button-with-tooltip";
import { ALLOWED_TYPES } from "@renderer/hooks/use-attachments";
import { cn } from "@renderer/lib/utils";
import { useQueryOne } from "@triplit/react";
import { Globe, Lightbulb, Paperclip } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface ActionGroupProps {
  onFilesSelect: (files: FileList) => void;
  disabled: boolean;
}

const { settingsService } = window.service;

export function ActionGroup({ onFilesSelect, disabled }: ActionGroupProps) {
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
    if (disabled) return;
    await settingsService.setEnableWebSearch(!enabledWebSearch);
  };

  const handleReason = async () => {
    if (disabled) return;
    await settingsService.setEnableReason(!enabledReason);
  };

  return (
    <div className="flex flex-row items-center gap-x-2">
      <ButtonWithTooltip
        title={t("chat.tool-bar.attach-file")}
        onClick={handleAttachFile}
      >
        <Paperclip className="size-4" />
      </ButtonWithTooltip>

      <ButtonWithTooltip
        className={cn(
          enabledReason && "bg-primary/15 text-primary",
          disabled && "cursor-not-allowed opacity-50",
        )}
        title={
          disabled ? t("chat.tool-bar.disabled") : t("chat.tool-bar.thinking")
        }
        onClick={handleReason}
      >
        <Lightbulb className="size-4" />
      </ButtonWithTooltip>

      <ButtonWithTooltip
        className={cn(
          enabledWebSearch && "bg-primary/15 text-primary",
          disabled && "cursor-not-allowed opacity-50",
        )}
        title={
          disabled
            ? t("chat.tool-bar.disabled")
            : t("chat.tool-bar.online-search")
        }
        onClick={handleWebSearch}
      >
        <Globe className="size-4" />
      </ButtonWithTooltip>

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
