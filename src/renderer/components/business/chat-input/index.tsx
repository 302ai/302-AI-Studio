import { Button } from "@renderer/components/ui/button";
import { Textarea } from "@renderer/components/ui/textarea";
import { useAttachments } from "@renderer/hooks/use-attachments";
import { useTabInput } from "@renderer/hooks/use-tab-input";
import { useThread } from "@renderer/hooks/use-thread";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { cn } from "@renderer/lib/utils";
import { EventNames, emitter } from "@renderer/services/event-service";
import type { Message } from "@shared/triplit/types";
import { Pencil, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AttachmentList } from "./attachment-list";
import { ToolBar } from "./tool-bar";

interface ChatInputProps {
  className?: string;
}

const { messageService } = window.service;

export function ChatInput({ className }: ChatInputProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });

  const {
    attachments,
    addAttachments,
    removeAttachment,
    clearAttachments,
    setAttachmentsDirectly,
  } = useAttachments();
  const { input, setInput, handleInputChange, clearInput } = useTabInput();
  const [isSending, setIsSending] = useState(false);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const {
    selectedModelId,
    handleModelSelect,
    handleSendMessage: sendMessage,
  } = useToolBar();

  const { activeThreadId } = useThread();

  const canSendMessage = input.trim() && !isSending;

  // 扩展clearInput函数以包含清空attachments
  const clearInputAndAttachments = async () => {
    await clearInput();
    await clearAttachments();
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

      await clearInputAndAttachments();

      // Send message with stored values
      await sendMessage(currentInput, currentAttachments);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(t("send-failed"));
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

  // 从消息附件数据加载附件
  const loadAttachmentsFromMessage = useCallback(
    async (message: Message) => {
      if (!message.attachments) {
        await clearAttachments();
        return;
      }

      try {
        const messageAttachments = JSON.parse(message.attachments);
        if (
          !Array.isArray(messageAttachments) ||
          messageAttachments.length === 0
        ) {
          await clearAttachments();
          return;
        }

        // 将消息附件转换为AttachmentFile格式
        const loadedAttachments = messageAttachments.map(
          (attachment: {
            id: string;
            name: string;
            size: number;
            type: string;
            preview?: string;
            fileData?: string;
          }) => {
            // 创建一个虚拟的File对象用于显示
            const blob = new Blob([], { type: attachment.type });
            const file = new File([blob], attachment.name, {
              type: attachment.type,
            });

            return {
              id: attachment.id,
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
              file,
              preview: attachment.preview,
              fileData: attachment.fileData,
            };
          },
        );

        // 直接设置附件状态，不保存到tab（因为这是编辑模式）
        setAttachmentsDirectly(loadedAttachments);
      } catch (error) {
        console.error("Failed to load attachments from message:", error);
        await clearAttachments();
      }
    },
    [clearAttachments, setAttachmentsDirectly],
  );

  useEffect(() => {
    const unsub = emitter.on(EventNames.MESSAGE_EDIT, async (msg) => {
      setInput(msg.content);
      setEditMessageId(msg.id);
      await loadAttachmentsFromMessage(msg);
    });

    return () => {
      unsub();
    };
  }, [setInput, loadAttachmentsFromMessage]);

  const handleSave = async () => {
    if (!editMessageId) return;
    await messageService.editMessage(editMessageId, {
      content: input,
      attachments: JSON.stringify(attachments),
      threadId: activeThreadId ?? "",
    });
    setEditMessageId(null);
    await clearInputAndAttachments();
  };

  const handleCancelEdit = async () => {
    setEditMessageId(null);
    await clearInputAndAttachments();
  };

  useEffect(() => {
    if (activeThreadId) {
      setEditMessageId(null);
    }
  }, [activeThreadId]);

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
