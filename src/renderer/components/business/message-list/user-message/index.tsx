import { useContextMenu } from "@renderer/hooks/use-context-menu";
import { useMessageActions } from "@renderer/hooks/use-message-actions";
import { useMessageCopy } from "@renderer/hooks/use-message-copy";
import type { Message } from "@shared/triplit/types";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageContextMenu } from "../message-context-menu";
import { MessageActions } from "./message-actions";
import { MessageContent } from "./message-content";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("translation", { keyPrefix: "message" });

  // Hooks
  const { handleCopy, handleCopySelected, getSelectedText } = useMessageCopy();
  const {
    contextMenuOpen,
    contextMenuPosition,
    handleContextMenu,
    closeContextMenu,
    setContextMenuOpen,
  } = useContextMenu();
  const { handleEditUserMessage, handleDeleteMessage } = useMessageActions();

  // Event handlers
  const onEdit = () => {
    handleEditUserMessage(message);
    closeContextMenu();
  };

  const onCopy = () => {
    handleCopy(message.content);
    closeContextMenu();
  };

  const onCopySelected = () => {
    handleCopySelected();
    closeContextMenu();
  };

  const onDelete = () => {
    handleDeleteMessage(message.id, message.threadId);
    closeContextMenu();
  };

  // Context menu actions configuration
  const contextMenuActions = [
    {
      key: "edit",
      label: t("edit"),
      onAction: onEdit,
    },
    {
      key: "delete",
      label: t("delete"),
      onAction: onDelete,
      isDanger: true,
    },
  ];

  return (
    <>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: needed for context menu handling */}
      <div
        ref={containerRef}
        className="group flex w-full justify-end"
        onContextMenu={handleContextMenu}
      >
        <div className="flex max-w-full flex-col gap-2">
          <MessageContent messageId={message.id} content={message.content} />

          <MessageActions onEdit={onEdit} />
        </div>
      </div>

      <MessageContextMenu
        isOpen={contextMenuOpen}
        onOpenChange={setContextMenuOpen}
        containerRef={containerRef}
        position={contextMenuPosition}
        actions={contextMenuActions}
        hasSelectedText={!!getSelectedText()}
        onCopy={onCopy}
        onCopySelected={onCopySelected}
      />
    </>
  );
}
