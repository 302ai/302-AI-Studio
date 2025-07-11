import { triplitClient } from "@renderer/client";
import { LdrsLoader } from "@renderer/components/business/ldrs-loader";
import { ContentBlocks } from "@renderer/components/business/markdown/content-blocks";
import { MarkdownRenderer } from "@renderer/components/business/markdown/markdown-renderer";
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@renderer/components/ui/context-menu";
import { MenuContent } from "@renderer/components/ui/menu";
import { useActiveTab } from "@renderer/hooks/use-active-tab";
import { useContentBlocks } from "@renderer/hooks/use-content-blocks";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { formatTimeAgo } from "@renderer/lib/utils";
import logger from "@shared/logger/renderer-logger";
import type { CreateMessageData, Message } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import { enUS, ja, zhCN } from "date-fns/locale";
import i18next from "i18next";
import { Check, Copy, Pencil, RefreshCcw } from "lucide-react";
import { useRef, useState } from "react";
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
  const { result: provider } = useQueryOne(triplitClient, providerQuery);

  // Extract clean content with streaming support for all block types
  const { cleanContent } = useContentBlocks(message.content || "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setContextMenuOpen(false);
      toast.success(t("copy-success"));
    } catch (error) {
      logger.error("复制失败", { error });
      toast.error(t("copy-failed"));
    }
  };

  const handleCopySelected = async () => {
    try {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || "";
      if (selectedText) {
        await navigator.clipboard.writeText(selectedText);
        setContextMenuOpen(false);
        toast.success(t("copy-success"));
      }
    } catch (error) {
      logger.error("复制选中内容失败", { error });
      toast.error(t("copy-failed"));
    }
  };

  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection?.toString() || "";
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
        providerId: provider?.id ?? "",
      });

      if (!thread) {
        logger.error("Failed to create thread");
        return;
      }

      const { id: threadId, title } = thread;

      const newTab = await tabService.insertTab({
        title,
        threadId,
        type: "thread",
      });

      if (!newTab) {
        logger.error("Failed to create new tab");
        return;
      }

      const messages = await messageService.getMessagesByThreadId(
        message.threadId,
      );

      const currentMessageIndex = messages.findIndex(
        (msg) => msg.id === message.id,
      );

      if (currentMessageIndex === -1) {
        logger.warn("Current message not found in thread");
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
      logger.error("Error creating new branch:", { error });
      toast.error(t("context-menu.create-new-branch-error"));
    }
  };

  const handleDelete = async () => {
    try {
      await messageService.deleteMessage(message.id, message.threadId);
      setContextMenuOpen(false);
      toast.success(t("delete-success"));
    } catch (error) {
      logger.error("Error deleting message:", { error });
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
        <ModelIcon className="size-6" modelName={provider?.name ?? ""} />

        <div className="w-full min-w-0">
          <MessageAttachments messageId={message.id} className="mb-2" />
          {/* Model name display */}
          {message.modelName && (
            <div className="mb-2 text-muted-fg text-xs">
              {message.modelName}
            </div>
          )}
          {/* Unified content blocks rendering */}
          <ContentBlocks
            content={message.content || ""}
            messageId={message.id}
          />
          {/* Main content display */}
          {cleanContent && (
            <div className="overflow-wrap-anywhere w-full break-words break-all text-fg">
              <MarkdownRenderer>{cleanContent}</MarkdownRenderer>
            </div>
          )}
          {message.status === "pending" && (
            <div className="mt-2 flex items-center gap-2 text-muted-fg text-sm">
              <div className="flex items-center gap-x-4">
                {t("thinking")}
                <LdrsLoader type="dot-pulse" />
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
              {(message.status === "success" || message.status === "stop") && (
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

              {(message.status === "success" || message.status === "stop") && (
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
          {getSelectedText() && (
            <ContextMenuItem onAction={handleCopySelected}>
              {t("context-menu.copy-selected")}
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />

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
              handleCreateNewBranch();
              setContextMenuOpen(false);
            }}
          >
            {t("context-menu.create-new-branch")}
          </ContextMenuItem>

          <ContextMenuSeparator />

          {(message.status === "success" || message.status === "stop") && (
            <ContextMenuItem
              onAction={() => {
                handleEdit();
                setContextMenuOpen(false);
              }}
            >
              {t("edit")}
            </ContextMenuItem>
          )}
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
