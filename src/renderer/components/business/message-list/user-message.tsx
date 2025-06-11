import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import type { Message } from "@shared/triplit/types";
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
    <div className="flex w-full justify-end">
      <div className="w-fit max-w-[80%] rounded-2xl bg-accent px-4 py-2">
        {attachments.length > 0 && (
          <div className="mb-2">
            <MessageAttachments attachments={attachments} />
          </div>
        )}

        {message.content && (
          <div className="whitespace-pre-wrap break-words">
            <MarkdownRenderer>{message.content}</MarkdownRenderer>
          </div>
        )}
      </div>
    </div>
  );
}
