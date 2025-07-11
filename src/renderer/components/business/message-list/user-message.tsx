import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@renderer/components/ui/context-menu";
import { MenuContent } from "@renderer/components/ui/menu";
import { EventNames, emitter } from "@renderer/services/event-service";
import logger from "@shared/logger/renderer-logger";
import type { Message } from "@shared/triplit/types";
import { Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ButtonWithTooltip } from "../button-with-tooltip";
import { LinkifiedText } from "./linkified-text";
import { MessageAttachments } from "./message-attachments";

interface UserMessageProps {
  message: Message;
}

const { messageService } = window.service;

export function UserMessage({ message }: UserMessageProps) {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });

  const onEdit = () => {
    emitter.emit(EventNames.MESSAGE_EDIT, message);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setContextMenuOpen(false);
      toast.success(t("copy-success"));
    } catch (error) {
      logger.error("copy failed", { error });
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
      logger.error("select copy failed", { error });
      toast.error(t("copy-failed"));
    }
  };

  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection?.toString() || "";
  };

  const handleDelete = async () => {
    try {
      await messageService.deleteMessage(message.id, message.threadId);
      setContextMenuOpen(false);
      toast.success(t("delete-success"));
    } catch (error) {
      logger.error("Error deleting message", { error });
      toast.error(t("delete-error"));
    }
  };

  return (
    <>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: needed for context menu handling */}
      <div
        ref={containerRef}
        className="group flex w-full justify-end"
        onContextMenu={handleContextMenu}
      >
        <div className="w-full min-w-0 max-w-[80%]">
          <div className="ml-auto w-fit max-w-full rounded-2xl bg-accent px-4 py-2">
            <MessageAttachments messageId={message.id} className="mb-2" />

            {message.content && (
              <div className="overflow-wrap-anywhere w-full break-words break-all text-accent-fg">
                <LinkifiedText text={message.content} />
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <ButtonWithTooltip
              type="button"
              onClick={onEdit}
              className="flex cursor-pointer items-center gap-1 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
              title={t("edit")}
              size="extra-small"
              intent="plain"
            >
              <Pencil className="h-3 w-3" />
            </ButtonWithTooltip>
          </div>
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
          aria-label="User message options"
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
              onEdit();
              setContextMenuOpen(false);
            }}
          >
            {t("edit")}
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
    </>
  );
}
