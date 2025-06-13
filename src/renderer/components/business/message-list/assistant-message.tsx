import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import { PulseLoader } from "@renderer/components/ui/loader-ldrs";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { formatTimeAgo } from "@renderer/lib/utils";
import { triplitClient } from "@shared/triplit/client";
import type { Message } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { enUS, ja, zhCN } from "date-fns/locale";
import i18next from "i18next";
import { Check, Copy, Pencil, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "../button-with-tooltip";
import { ModelIcon } from "../model-icon";
import { EditMessageDialog } from "./edit-message-dialog";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const currentLanguage = i18next.language;
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });

  const providerQuery = triplitClient
    .query("providers")
    .Where("id", "=", message.providerId);
  const { results: providerResults } = useQuery(triplitClient, providerQuery);
  const providerName = useMemo(() => {
    const provider = providerResults?.[0];
    return provider?.name ?? "";
  }, [providerResults]);

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

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  return (
    <div className="group flex flex-row gap-2">
      <ModelIcon className="size-6" modelName={providerName} />

      <div className="w-full min-w-0">
        {attachments.length > 0 && (
          <div className="mb-2">
            <MessageAttachments attachments={attachments} />
          </div>
        )}

        {message.content && (
          <div className="w-full">
            <MarkdownRenderer>{message.content}</MarkdownRenderer>
          </div>
        )}

        {message.status === "pending" && (
          <div className="mt-2 flex items-center gap-2 text-muted-fg text-sm">
            <div className="flex items-center gap-x-4">
              {t("thinking")}
              <PulseLoader />
            </div>
          </div>
        )}

        {message.status === "error" && (
          <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
            <div className="h-2 w-2 rounded-full bg-current" />
            {t("generate-failed")}
          </div>
        )}

        {(message.status === "success" || message.status === "stop") && (
          <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {message.status === "success" && (
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
            )}

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

            {message.status === "success" && (
              <ButtonWithTooltip
                type="button"
                onClick={handleEdit}
                className="flex cursor-pointer items-center gap-1 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                title={t("edit")}
                size="extra-small"
                intent="plain"
              >
                <Pencil className="h-3 w-3" />
              </ButtonWithTooltip>
            )}

            <div className="ml-2 text-muted-fg text-xs">
              {formatTimeAgo(
                message.createdAt.toISOString(),
                localeMap[currentLanguage],
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditMessageDialog
        message={message}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}
