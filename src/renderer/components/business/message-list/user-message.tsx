import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { formatTimeAgo } from "@renderer/lib/utils";
import type { Message } from "@shared/triplit/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
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
    <div className="group w-full px-6 py-6">
      <div className="flex w-full justify-end">
        <div className="w-full max-w-4xl">
          {/* 消息头部 - 右对齐 */}
          <div className="mb-4 flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-fg text-xs opacity-0 transition-opacity group-hover:opacity-100">
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
              <span className="font-medium text-sm">You</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <User className="h-5 w-5 text-primary-fg" />
            </div>
          </div>

          {/* 消息内容区域 - 右对齐 */}
          <div className="flex w-full justify-end">
            <div className="w-full">
              {/* 附件 */}
              {attachments.length > 0 && (
                <div className="mb-3 flex justify-end">
                  <MessageAttachments attachments={attachments} />
                </div>
              )}

              {/* 消息内容 - 支持markdown渲染 */}
              {message.content && (
                <div className="text-right">
                  <div className="whitespace-pre-wrap break-words text-fg">
                    <MarkdownRenderer>{message.content}</MarkdownRenderer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 状态信息 - 右对齐 */}
          <div className="mt-3 flex items-center justify-end gap-2">
            {message.status === "pending" && (
              <div className="flex items-center gap-2 text-muted-fg text-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
                发送中...
              </div>
            )}
            {message.status === "error" && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <div className="h-2 w-2 rounded-full bg-current" />
                发送失败
              </div>
            )}
            {message.status === "success" && (
              <div className="text-muted-fg text-xs opacity-0 transition-opacity group-hover:opacity-100">
                {formatTimeAgo(message.createdAt.toISOString(), zhCN)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
