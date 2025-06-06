import { Textarea } from "@renderer/components/ui/textarea";
import { useAttachments } from "@renderer/hooks/use-attachments";
import { cn } from "@renderer/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AttachmentList } from "./attachment-list";
import { ToolBar } from "./tool-bar";

interface ChatInputProps {
  className?: string;
}

export function ChatInput({ className }: ChatInputProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });

  const { attachments, addAttachments, removeAttachment } = useAttachments();
  const [input, setInput] = useState("");

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>
      {attachments.length > 0 && (
        <div className="mb-2">
          <AttachmentList
            attachments={attachments}
            onRemove={removeAttachment}
          />
        </div>
      )}

      <div
        className={cn(
          "relative",
          "flex max-h-60 min-h-36 w-full flex-col rounded-[20px] border border-input pt-2 pr-2 pb-0 pl-4",
          "focus-within:border-ring/70 focus-within:outline-hidden focus-within:ring-4 focus-within:ring-ring/20",
        )}
      >
        <Textarea
          className={cn(
            "w-full flex-1 rounded-none border-0 bg-transparent p-0",
            "resize-none shadow-none ring-0",
            "min-h-[calc(9rem-var(--chat-input-toolbar-height))]",
          )}
          placeholder={t("input-placeholder")}
          aria-label={t("input-label")}
          resize="none"
          value={input}
          onChange={handleInputChange}
        />

        <ToolBar
          className="mb-2"
          onFilesSelect={addAttachments}
          attachments={attachments}
          input={input}
        />
      </div>
    </div>
  );
}
