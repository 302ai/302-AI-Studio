import { triplitClient } from "@renderer/client";
import { useContextMenu } from "@renderer/hooks/use-context-menu";
import { useMessageActions } from "@renderer/hooks/use-message-actions";
import { useMessageCopy } from "@renderer/hooks/use-message-copy";
import type { Message, Settings } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageContextMenu } from "../message-context-menu";
import { EditMessageDialog } from "./edit-message-dialog";
import { MessageActions } from "./message-actions";
import { MessageContent } from "./message-content";
import { MessageHeader } from "./message-header";
import { MessageStatus } from "./message-status";

interface AssistantMessageProps {
  message: Message;
  handleRefreshMessage: (messageId: string) => Promise<void>;
  settings: Settings[];
}

export function AssistantMessage({
  message,
  handleRefreshMessage,
  settings,
}: AssistantMessageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
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
  const {
    isEditDialogOpen,
    setIsEditDialogOpen,
    handleRefreshMessage: handleRefresh,
    handleEditAssistantMessage,
    handleCreateNewBranch,
    handleDeleteMessage,
  } = useMessageActions();

  // Provider query
  const providerQuery = triplitClient.query("providers").Id(message.providerId);
  const { result: provider } = useQueryOne(triplitClient, providerQuery);

  // Event handlers
  const onCopy = () => {
    handleCopy(message.content);
    closeContextMenu();
  };

  const onCopySelected = () => {
    handleCopySelected();
    closeContextMenu();
  };

  const onRefresh = () => {
    handleRefresh(message.id, handleRefreshMessage);
    closeContextMenu();
  };

  const onCreateBranch = () => {
    handleCreateNewBranch(message, provider?.id ?? "");
    closeContextMenu();
  };

  const onEdit = () => {
    handleEditAssistantMessage();
    closeContextMenu();
  };

  const onDelete = () => {
    handleDeleteMessage(message.id, message.threadId);
    closeContextMenu();
  };

  // Context menu actions configuration for assistant message
  const contextMenuActions = [
    {
      key: "refresh",
      label: t("refresh"),
      onAction: onRefresh,
    },
    {
      key: "create-new-branch",
      label: t("context-menu.create-new-branch"),
      onAction: onCreateBranch,
    },
    {
      key: "edit",
      label: t("edit"),
      onAction: onEdit,
      condition: message.status === "success" || message.status === "stop",
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
        className="group flex flex-col gap-2"
        onContextMenu={handleContextMenu}
      >
        <MessageHeader
          providerName={provider?.name ?? ""}
          modelName={message.modelName}
        />

        <MessageContent
          messageId={message.id}
          content={message.content}
          settings={settings}
        />

        <MessageStatus status={message.status} />

        <MessageActions
          message={message}
          onRefresh={onRefresh}
          onEdit={handleEditAssistantMessage}
        />
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

      {/* Edit Dialog */}
      <EditMessageDialog
        message={message}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
