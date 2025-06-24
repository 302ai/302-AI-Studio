import { triplitClient } from "@renderer/client";
import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import { ThinkBlocks } from "@renderer/components/business/markdown/markdown-think-blocks";
import { ContextMenuItem } from "@renderer/components/ui/context-menu";
import { PulseLoader } from "@renderer/components/ui/loader-ldrs";
import { MenuContent } from "@renderer/components/ui/menu";
import { useActiveTab } from "@renderer/hooks/use-active-tab";
import { useThinkBlocks } from "@renderer/hooks/use-think-blocks";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { formatTimeAgo } from "@renderer/lib/utils";
import type { CreateMessageData, Message } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import { enUS, ja, zhCN } from "date-fns/locale";
import i18next from "i18next";
import { Check, Copy, Pencil, RefreshCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
const { tabService, messageService } = window.service;

export function AssistantMessage({
  message,
  handleRefreshMessage,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLanguage = i18next.language;
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });

  const { createThread, selectedModelId } = useToolBar();
  const { setActiveTabId } = useActiveTab();

  const providerQuery = triplitClient
    .query("providers")
    .Where("id", "=", message.providerId);
  // const modelQuery = triplitClient
  //   .query("models")
  //   .Where("id", "=", message.modelId);
  // const { results: modelResults } = useQuery(triplitClient, modelQuery);
  const { results: providerResults } = useQuery(triplitClient, providerQuery);
  const providerName = useMemo(() => {
    const provider = providerResults?.[0];
    return provider?.name ?? "";
  }, [providerResults]);

  // const modelName = useMemo(() => {
  //   const model = modelResults?.[0];
  //   return model?.name ?? "AI";
  // }, [modelResults]);

  // Extract clean content with streaming support
  const { cleanContent } = useThinkBlocks(message.content || "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setContextMenuOpen(false);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  const handleRefresh = () => {
    handleRefreshMessage(message.id);
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleCreateNewBranch = async () => {
    try {
      const thread = await createThread({
        title: t("context-menu.new-thread-title"),
        modelId: selectedModelId,
      });

      if (!thread) {
        console.error("Failed to create thread");
        return;
      }

      const { id: threadId, title } = thread;

      const newTab = await tabService.insertTab({
        title,
        threadId,
        type: "thread",
      });

      if (!newTab) {
        console.error("Failed to create new tab");
        return;
      }

      const messages = await messageService.getMessagesByThreadId(
        message.threadId,
      );

      const currentMessageIndex = messages.findIndex(
        (msg) => msg.id === message.id,
      );

      if (currentMessageIndex === -1) {
        console.warn("Current message not found in thread");
        await setActiveTabId(newTab.id);
        return;
      }

      const messagesToInsert = messages.slice(0, currentMessageIndex + 1);

      // 为复制的消息生成新的ID，避免与原始消息冲突
      const messagesToInsertData: CreateMessageData[] = messagesToInsert.map(
        (msg) => {
          const { id: _id, ...msgWithoutIdAndDate } = msg;
          return {
            ...msgWithoutIdAndDate,
            threadId,
          };
        },
      );

      await messageService.insertMessages(messagesToInsertData);

      await setActiveTabId(newTab.id);
    } catch (error) {
      console.error("Error creating new branch:", error);
      toast.error(t("context-menu.create-new-branch-error"));
    }
  };

  const handleDelete = async () => {
    try {
      await messageService.deleteMessage(message.id, message.threadId);
      setContextMenuOpen(false);
      toast.success(t("delete-success"));
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(t("delete-error"));
    }
  };

  return (
    <>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: needed for context menu handling */}
      <div
        ref={containerRef}
        className="group flex flex-row gap-2"
        onContextMenu={handleContextMenu}
      >
        <ModelIcon className="size-6" modelName={providerName} />

        <div className="w-full min-w-0">
          <MessageAttachments messageId={message.id} className="mb-2" />
          {/* Model name display */}
          {message.modelName && (
            <div className="mb-2 text-muted-fg text-xs">
              {message.modelName}
            </div>
          )}
          {/* Think content display */}
          <ThinkBlocks content={message.content || ""} messageId={message.id} />
          {/* Main content display */}
          {cleanContent && (
            <div className="overflow-wrap-anywhere w-full break-words break-all">
              <MarkdownRenderer>{cleanContent}</MarkdownRenderer>
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
          {(message.status === "success" ||
            message.status === "stop" ||
            message.status === "error") && (
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
      </div>

      {contextMenuOpen && (
        <MenuContent
          isOpen={contextMenuOpen}
          onOpenChange={setContextMenuOpen}
          triggerRef={containerRef}
          shouldFlip={false}
          placement="bottom left"
          offset={
            contextMenuPosition.y -
            (containerRef.current?.getBoundingClientRect().bottom || 0)
          }
          crossOffset={
            contextMenuPosition.x -
            (containerRef.current?.getBoundingClientRect().left || 0)
          }
          onClose={() => setContextMenuOpen(false)}
          aria-label="Assistant message options"
        >
          <ContextMenuItem onAction={handleCopy}>{t("copy")}</ContextMenuItem>
          <ContextMenuItem
            onAction={() => {
              handleRefresh();
              setContextMenuOpen(false);
            }}
          >
            {t("refresh")}
          </ContextMenuItem>
          <ContextMenuItem
            onAction={() => {
              handleEdit();
              setContextMenuOpen(false);
            }}
          >
            {t("edit")}
          </ContextMenuItem>

          <ContextMenuItem
            onAction={() => {
              handleCreateNewBranch();
              setContextMenuOpen(false);
            }}
          >
            {t("context-menu.create-new-branch")}
          </ContextMenuItem>

          <ContextMenuItem
            isDanger={true}
            onAction={() => {
              handleDelete();
              setContextMenuOpen(false);
            }}
          >
            {t("delete")}
          </ContextMenuItem>
        </MenuContent>
      )}

      {/* Edit Dialog */}
      <EditMessageDialog
        message={message}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
