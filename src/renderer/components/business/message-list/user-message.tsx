import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import type { Message } from "@shared/triplit/types";
import { format } from "date-fns";
import { User } from "lucide-react";
import { useMemo } from "react";
import { MessageAttachments } from "./message-attachments";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  const attachments = useMemo(() => {
    if (!message.attachments) return [];
    try {
      return JSON.parse(message.attachments) as AttachmentFile[];
    } catch {
      return [];
    }
  }, [message.attachments]);

  return (
    <div className="group w-full">
      <div className="mb-4 flex items-center justify-end gap-3">
        <span className="text-muted-fg text-xs opacity-0 transition-opacity group-hover:opacity-100">
          {format(new Date(message.createdAt), "HH:mm")}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <User className="h-5 w-5 text-primary-fg" />
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="mb-3 flex justify-end">
          <MessageAttachments attachments={attachments} />
        </div>
      )}

      {message.content && (
        <div className="whitespace-pre-wrap break-words text-right text-fg">
          <MarkdownRenderer>{message.content}</MarkdownRenderer>
        </div>
      )}
    </div>
  );
}
