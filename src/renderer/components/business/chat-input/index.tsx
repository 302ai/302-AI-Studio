import { Button } from "@renderer/components/ui/button";
import { Textarea } from "@renderer/components/ui/textarea";
import { useActiveTab } from "@renderer/hooks/use-active-tab";
import { useAttachments } from "@renderer/hooks/use-attachments";
import { useThread } from "@renderer/hooks/use-thread";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { cn } from "@renderer/lib/utils";
import { EventNames, emitter } from "@renderer/services/event-service";
import debounce from "lodash-es/debounce";
import { Pencil, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AttachmentList } from "./attachment-list";
import { ToolBar } from "./tool-bar";

interface ChatInputProps {
  className?: string;
}

const { messageService, tabService } = window.service;

// Process attachment data and convert to FileList
const processAttachmentsFromData = (
  attachmentData: Array<{
    name: string;
    type: string;
    preview?: string;
    fileData?: string;
  }>,
): FileList => {
  const dataTransfer = new DataTransfer();

  attachmentData.forEach((attachment) => {
    // Check if it's an image (has preview) or other file type (has fileData)
    const base64Data = attachment.preview || attachment.fileData;
    if (base64Data) {
      // Convert base64 data to File object
      const byteString = atob(base64Data.split(",")[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const int8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        int8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([int8Array], { type: attachment.type });
      const file = new File([blob], attachment.name, {
        type: attachment.type,
      });
      dataTransfer.items.add(file);
    }
  });

  return dataTransfer.files;
};

export function ChatInput({ className }: ChatInputProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });

  const { attachments, addAttachments, removeAttachment, clearAttachments } =
    useAttachments();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const {
    selectedModelId,
    handleModelSelect,
    handleSendMessage: sendMessage,
  } = useToolBar();

  const { activeThreadId } = useThread();
  const { activeTabId } = useActiveTab();

  const canSendMessage = input.trim() && !isSending;

  // 防抖更新tab的inputValue，避免频繁写入数据库
  const debouncedUpdateTabInput = useCallback(
    debounce(async (tabId: string, inputValue: string) => {
      if (tabId) {
        try {
          await tabService.updateTab(tabId, { inputValue });
        } catch (error) {
          console.error("Failed to update tab input value:", error);
        }
      }
    }, 500), // 500ms防抖延迟
    [],
  );

  const handleInputChange = (value: string) => {
    setInput(value);
    // 使用防抖更新tab的inputValue
    if (activeTabId) {
      debouncedUpdateTabInput(activeTabId, value);
    }
  };

  const clearInput = async () => {
    setInput("");
    clearAttachments();
    // 清空input时也清空tab的inputValue
    if (activeTabId) {
      await tabService.updateTab(activeTabId, { inputValue: "" });
    }
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

      await clearInput();

      // Send message with stored values
      await sendMessage(currentInput, currentAttachments);
      // 发送消息后，清空inputValue
      if (activeTabId) {
        await tabService.updateTab(activeTabId, { inputValue: "" });
      }
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
        setEditMessageId(null);
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

  useEffect(() => {
    const unsub = emitter.on(EventNames.MESSAGE_EDIT, (msg) => {
      if (editMessageId === msg.id) return;
      setInput(msg.content);
      if (msg.attachments) {
        const attachmentData = JSON.parse(msg.attachments);
        if (Array.isArray(attachmentData) && attachmentData.length > 0) {
          const fileList = processAttachmentsFromData(attachmentData);
          addAttachments(fileList);
        }
      }
      setEditMessageId(msg.id);
    });

    return () => {
      unsub();
    };
  }, [addAttachments, editMessageId]);

  const handleSave = async () => {
    if (!editMessageId) return;
    await messageService.editMessage(editMessageId, {
      content: input,
      attachments: JSON.stringify(attachments),
      threadId: activeThreadId ?? "",
    });
    setEditMessageId(null);
    await clearInput();
  };

  const handleCancelEdit = async () => {
    setEditMessageId(null);
    await clearInput();
  };

  // 当tab切换时，从数据库加载inputValue
  useEffect(() => {
    const loadTabInputValue = async () => {
      if (activeTabId) {
        try {
          const tab = await tabService.getTab(activeTabId);
          if (tab?.inputValue) {
            setInput(tab.inputValue);
          } else {
            setInput("");
          }
        } catch (error) {
          console.error("Failed to load tab input value:", error);
        }
      }
    };

    loadTabInputValue();
  }, [activeTabId]);

  useEffect(() => {
    if (activeThreadId) {
      console.log("Thread changed, current input value:", input);
      setEditMessageId(null);
    }
  }, [activeThreadId, input]);

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
      {editMessageId && (
        <div className="my-1 mt-2 flex justify-between px-2 text-xs">
          <div className="flex items-center gap-x-1">
            <Pencil className="size-4" />
            {t("edit-message")}
          </div>
          <div className="flex items-center gap-x-1 text-xs">
            <Button intent="outline" onClick={handleSave} size="extra-small">
              {t("edit-message-only-save")}
            </Button>
            <X className="size-4 cursor-pointer" onClick={handleCancelEdit} />
          </div>
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
          setEditMessageId={setEditMessageId}
        />
      </div>
    </div>
  );
}
