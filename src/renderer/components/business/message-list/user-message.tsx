import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import type { Message } from "@shared/triplit/types";
import { format } from "date-fns";
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
    <div className="flex justify-end">
      <div className="max-w-[70%] space-y-2">
        <div className="flex items-end justify-end gap-2">
          <div className="text-right text-muted-foreground text-xs">
            {format(new Date(message.createdAt), "HH:mm")}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
            U
          </div>
        </div>

        {/* 聊天气泡 - 包含消息内容和附件 */}
        <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground">
          {/* 附件 - 在消息内容之前显示 */}
          {attachments.length > 0 && (
            <div className="mb-3">
              <MessageAttachments attachments={attachments} />
            </div>
          )}

          {/* 消息内容 */}
          {message.content && (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>

        {/* 时间和状态 */}
        <div className="mt-1 flex items-center justify-end">
          {message.status === "pending" && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
              发送中...
            </div>
          )}
          {message.status === "error" && (
            <div className="flex items-center gap-1 text-destructive text-xs">
              <div className="h-2 w-2 rounded-full bg-current" />
              发送失败
            </div>
          )}
          {message.status === "success" && (
            <div className="text-muted-foreground text-xs">刚刚</div>
          )}
        </div>
      </div>
    </div>
  );
}
