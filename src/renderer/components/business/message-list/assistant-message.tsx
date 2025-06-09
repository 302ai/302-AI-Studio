import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { formatTimeAgo } from "@renderer/lib/utils";
import type { Message } from "@shared/triplit/types";
import { format } from "date-fns";
import { enUS, ja, zhCN } from "date-fns/locale";
import i18next from "i18next";
import { Bot, Check, Copy, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { MessageAttachments } from "./message-attachments";

const localeMap = {
  zh: zhCN,
  en: enUS,
  ja: ja,
};

interface AssistantMessageProps {
  message: Message;
  handleRefreshMessage: (messageId: string) => Promise<void>;
}

export function AssistantMessage({
  message,
  handleRefreshMessage,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  const currentLanguage = i18next.language;
  console.log(currentLanguage);

  const attachments = useMemo(() => {
    if (!message.attachments) return [];
    try {
      return JSON.parse(message.attachments) as AttachmentFile[];
    } catch {
      return [];
    }
  }, [message.attachments]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const handleRefresh = () => {
    handleRefreshMessage(message.id);
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-muted-foreground text-xs">
            {format(new Date(message.createdAt), "HH:mm")}
          </div>
        </div>

        {/* 聊天气泡 - 包含消息内容和附件 */}
        <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
          {/* 附件 - 在消息内容之前显示 */}
          {attachments.length > 0 && (
            <div className="mb-3">
              <MessageAttachments attachments={attachments} />
            </div>
          )}

          {/* 消息内容 */}
          {message.content && (
            <div className="whitespace-pre-wrap break-words text-foreground">
              {message.content}
            </div>
          )}
        </div>

        {/* 消息状态 */}
        {message.status === "pending" && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <div className="flex gap-1">
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-current"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-current"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-current"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            AI正在思考...
          </div>
        )}
        {message.status === "error" && (
          <div className="flex items-center gap-1 text-destructive text-xs">
            <div className="h-2 w-2 rounded-full bg-current" />
            生成失败
          </div>
        )}

        {/* 操作按钮和时间 - 同一行 */}
        {message.status === "success" && (
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
                title="复制"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
                title="重新生成"
              >
                <RefreshCcw className="h-3 w-3" />
              </button>
            </div>
            <div className="text-muted-foreground text-xs">
              {formatTimeAgo(
                message.createdAt.toISOString(),
                localeMap[currentLanguage],
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
