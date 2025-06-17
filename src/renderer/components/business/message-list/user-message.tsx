import { ContextMenuItem } from "@renderer/components/ui/context-menu";
import { MenuContent } from "@renderer/components/ui/menu";
import type { AttachmentFile } from "@renderer/hooks/use-attachments";
import { EventNames, emitter } from "@renderer/services/event-service";
import type { Message } from "@shared/triplit/types";
import { Copy, Pencil } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "../button-with-tooltip";
import { MessageAttachments } from "./message-attachments";

interface UserMessageProps {
  message: Message;
}

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

  const attachments = useMemo(() => {
    if (!message.attachments) return [];
    try {
      return JSON.parse(message.attachments) as AttachmentFile[];
    } catch {
      return [];
    }
  }, [message.attachments]);

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
    } catch (error) {
      console.error("复制失败:", error);
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
          <div className="ml-auto w-fit rounded-2xl bg-accent px-4 py-2">
            {attachments.length > 0 && (
              <div className="mb-2">
                <MessageAttachments attachments={attachments} />
              </div>
            )}

            {message.content && (
              <div className="w-full whitespace-pre-wrap break-words">
                {message.content}
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
          <ContextMenuItem onAction={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            {t("copy")}
          </ContextMenuItem>
          <ContextMenuItem
            onAction={() => {
              onEdit();
              setContextMenuOpen(false);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </ContextMenuItem>
        </MenuContent>
      )}
    </>
  );
}
