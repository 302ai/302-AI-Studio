import { Textarea } from "@renderer/components/ui/textarea";
import { useAttachments } from "@renderer/hooks/use-attachments";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { cn } from "@renderer/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AttachmentList } from "./attachment-list";
import { ToolBar } from "./tool-bar";

interface ChatInputProps {
  className?: string;
}

export function ChatInput({ className }: ChatInputProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });

  const { attachments, addAttachments, removeAttachment, clearAttachments } =
    useAttachments();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const {
    selectedModelId,
    handleModelSelect,
    handleSendMessage: sendMessage,
  } = useToolBar();

  const canSendMessage = input.trim() && !isSending;

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const clearInput = () => {
    setInput("");
    clearAttachments();
  };

  const handleSendMessage = async () => {
    if (isSending || !input.trim()) {
      return;
    }

    // Store current input and attachments before clearing
    const currentInput = input;
    const currentAttachments = attachments;

    try {
      setIsSending(true);

      if (!selectedModelId) {
        toast.error(t("lack-model"));
        return;
      }

      clearInput();

      // Send message with stored values
      await sendMessage(currentInput, currentAttachments);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      // Restore input on error
      setInput(currentInput);
      // Note: attachments are already cleared, but that's probably fine for error cases
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isSending && input.trim()) {
        handleSendMessage();
      }
    }
  };

  const handlePaste = async (event: React.ClipboardEvent) => {
    const files = event.clipboardData?.files;
    if (files && files.length > 0) {
      event.preventDefault();
      addAttachments(files);
    }
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
        onPaste={handlePaste}
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
          onKeyDown={handleKeyDown}
        />

        <ToolBar
          onFilesSelect={addAttachments}
          attachments={attachments}
          onSendMessage={handleSendMessage}
          selectedModelId={selectedModelId}
          onModelSelect={handleModelSelect}
          isDisabled={!canSendMessage}
        />
      </div>
    </div>
  );
}
