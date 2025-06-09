import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { formatTimeAgo } from "@renderer/lib/utils";
import type { Message } from "@shared/triplit/types";
import { format } from "date-fns";
import { enUS, ja, zhCN } from "date-fns/locale";
import i18next from "i18next";
import { Bot, Check, Copy, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });
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
    <div className="w-full px-6 py-6">
      <div className="flex w-full justify-start">
        <div className="w-full">
          {/* 消息头部 - 左对齐 */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-5 w-5 text-primary-fg" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">AI Assistant</span>
              <span className="text-muted-fg text-xs">
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
            </div>
          </div>

          {/* 消息内容区域 - 左对齐 */}
          <div className="flex w-full justify-start">
            <div className="w-full">
              {/* 附件 */}
              {attachments.length > 0 && (
                <div className="mb-3">
                  <MessageAttachments attachments={attachments} />
                </div>
              )}

              {/* 消息内容 - 使用MarkdownRenderer渲染，无气泡样式 */}
              {message.content && (
                <div className="w-full">
                  <MarkdownRenderer>{message.content}</MarkdownRenderer>
                </div>
              )}
            </div>
          </div>

          {/* 消息状态 */}
          {message.status === "pending" && (
            <div className="mt-3 flex items-center gap-2 text-muted-fg text-sm">
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
            <div className="mt-3 flex items-center gap-2 text-destructive text-sm">
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
                className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-muted-fg text-xs transition-colors hover:bg-muted hover:text-fg"
                title={t("copy")}
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
                className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-muted-fg text-xs transition-colors hover:bg-muted hover:text-fg"
                title={t("refresh")}
              >
                <RefreshCcw className="h-3 w-3" />
              </button>
            </div>
            <div className="text-muted-fg text-xs">
              {formatTimeAgo(
                message.createdAt.toISOString(),
                localeMap[currentLanguage],
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
