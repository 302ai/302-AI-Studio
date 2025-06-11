import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import { PulseLoader } from "@renderer/components/ui/loader-ldrs";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { formatTimeAgo } from "@renderer/lib/utils";
import type { Message } from "@shared/triplit/types";
import { format } from "date-fns";
import { enUS, ja, zhCN } from "date-fns/locale";
import i18next from "i18next";
import { Bot, Check, Copy, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "../button-with-tooltip";
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
    <div className="group w-full">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
          <Bot className="h-5 w-5 text-primary-fg" />
        </div>
        <span className="text-muted-fg text-xs opacity-0 transition-opacity group-hover:opacity-100">
          {format(new Date(message.createdAt), "HH:mm")}
        </span>
      </div>

      {attachments.length > 0 && (
        <div className="mb-3">
          <MessageAttachments attachments={attachments} />
        </div>
      )}

      {message.content && (
        <div className="w-full">
          <MarkdownRenderer>{message.content}</MarkdownRenderer>
        </div>
      )}

      {message.status === "pending" && (
        <div className="mt-3 flex items-center gap-2 text-muted-fg text-sm">
          <div className="flex items-center gap-x-4">
            {t("thinking")}
            <PulseLoader />
          </div>
        </div>
      )}

      {message.status === "error" && (
        <div className="mt-3 flex items-center gap-2 text-destructive text-sm">
          <div className="h-2 w-2 rounded-full bg-current" />
          生成失败
        </div>
      )}

      {message.status === "success" && (
        <div className="mt-1 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <ButtonWithTooltip
              type="button"
              onClick={handleCopy}
              title={t("copy")}
              size="extra-small"
              intent="plain"
              className="flex cursor-pointer items-center gap-1 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </ButtonWithTooltip>

            <ButtonWithTooltip
              type="button"
              onClick={handleRefresh}
              className="flex cursor-pointer items-center gap-1 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
              title={t("refresh")}
              size="extra-small"
              intent="plain"
            >
              <RefreshCcw className="h-3 w-3" />
            </ButtonWithTooltip>

            <div className="ml-2 text-muted-fg text-xs">
              {formatTimeAgo(
                message.createdAt.toISOString(),
                localeMap[currentLanguage],
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
