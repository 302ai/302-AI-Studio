import { triplitClient } from "@renderer/client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@renderer/components/ui/context-menu";
import { TextField } from "@renderer/components/ui/text-field";
import {
  type MenuModelActionType,
  useThreadMenu,
} from "@renderer/hooks/use-thread-menu";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { cn } from "@renderer/lib/utils";
import type { Thread } from "@shared/triplit/types";
import { useQuery } from "@triplit/react";
import {
  Eraser,
  FileText,
  FolderX,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ActionGroup } from "../action-group";
import { ModalAction } from "../modal-action";

interface ThreadMenuProps {
  thread: Thread;
  activeThreadId: string;
}
const { messageService, providerService, threadService, tabService } =
  window.service;

export function ThreadMenu({ thread, activeThreadId }: ThreadMenuProps) {
  const { t } = useTranslation();
  const providersQuery = triplitClient.query("providers");
  const { results: providers } = useQuery(triplitClient, providersQuery);
  const modelsQuery = triplitClient.query("models");
  const { results: models } = useQuery(triplitClient, modelsQuery);
  const messagesQuery = triplitClient
    .query("messages")
    .Where("threadId", "=", thread.id);
  const { results: messages } = useQuery(triplitClient, messagesQuery);

  const tabsQuery = triplitClient.query("tabs");
  const { results: tabs } = useQuery(triplitClient, tabsQuery);

  const { selectedModelId } = useToolBar();

  const {
    state,
    newTitle,
    formattedTitle,
    setState,
    setNewTitle,
    closeModal,

    handleRename,
    handleCleanMessages,
    handleDelete,
    handleCollectThread,
    handleDeleteAll,
  } = useThreadMenu(thread);

  const actionType = (action: MenuModelActionType | null) => {
    const initialsState = {
      title: "",
      descriptions: [""],
      confirmText: "",
      action: () => {},
    };

    switch (action) {
      case "rename":
        return {
          title: t("thread-menu.actions.rename.title"),
          descriptions: [t("thread-menu.actions.rename.description")],
          confirmText: t("thread-menu.actions.rename.confirmText"),
          body: (
            <TextField
              aria-label={`Rename thread ${thread.title}`}
              value={newTitle}
              onChange={setNewTitle}
              autoFocus
              placeholder={t("thread-menu.actions.rename.edit.placeholder")}
            />
          ),
          action: async () => await handleRename(),
          disabled: formattedTitle.length === 0,
        };

      case "clean-messages":
        return {
          title: t("thread-menu.actions.clean-messages.title"),
          descriptions: [t("thread-menu.actions.clean-messages.description")],
          confirmText: t("thread-menu.actions.clean-messages.confirmText"),
          action: async () => await handleCleanMessages(),
        };

      case "delete":
        return {
          title: t("thread-menu.actions.delete.title"),
          descriptions: [t("thread-menu.actions.delete.description")],
          confirmText: t("thread-menu.actions.delete.confirmText"),
          action: async () => await handleDelete(),
        };

      case "delete-all":
        return {
          title: t("thread-menu.actions.delete-all.title"),
          descriptions: [t("thread-menu.actions.delete-all.description")],
          confirmText: t("thread-menu.actions.delete-all.confirmText"),
          action: async () => await handleDeleteAll(),
        };

      default:
        return initialsState;
    }
  };

  const handleGenerateTitle = async () => {
    const messages = await messageService.getMessagesByThreadId(thread.id);
    const model = models?.find((m) => m.id === selectedModelId);
    const provider = providers?.find((p) => p.id === model?.providerId);

    if (!provider || !model) {
      return;
    }

    const result = await providerService.summaryTitle({
      messages,
      provider,
      model,
    });
    if (result.success) {
      await threadService.updateThread(thread.id, {
        title: result.text,
      });

      const tab = tabs?.find((t) => t.threadId === thread.id);
      if (tab) {
        await tabService.updateTab(tab.id, {
          title: result.text,
        });
      }
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          className="relative w-full cursor-pointer truncate py-1.5 pr-7 text-left"
          title={thread.title}
        >
          {thread.title}
        </ContextMenuTrigger>

        <ActionGroup
          actionClassName={cn(
            "absolute right-3 size-6",
            activeThreadId === thread.id
              ? "hover:bg-accent-hover"
              : "hover:bg-hover-2",
          )}
          onStar={handleCollectThread}
          stared={thread.collected}
        />

        <ContextMenuContent aria-label={`Thread options for ${thread.title}`}>
          <ContextMenuItem onAction={() => setState("rename")}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.rename")}
          </ContextMenuItem>
          <ContextMenuItem
            onAction={handleGenerateTitle}
            isDisabled={!selectedModelId || messages?.length === 0}
            className={
              !selectedModelId || messages?.length === 0
                ? "cursor-default"
                : "cursor-pointer"
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.generate-title")}
          </ContextMenuItem>
          <ContextMenuItem onAction={() => setState("clean-messages")}>
            <Eraser className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.clean-messages")}
          </ContextMenuItem>
          <ContextMenuItem onAction={handleCollectThread}>
            <Package className="mr-2 h-4 w-4" />
            {thread.collected
              ? t("sidebar.menu-item.uncollect-thread")
              : t("sidebar.menu-item.collect-thread")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem isDanger={true} onAction={() => setState("delete")}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.delete")}
          </ContextMenuItem>
          <ContextMenuItem
            isDanger={true}
            onAction={() => setState("delete-all")}
          >
            <FolderX className="mr-2 h-4 w-4 stroke-2" />
            {t("sidebar.menu-item.delete-all")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ModalAction
        state={state}
        onOpenChange={closeModal}
        actionType={actionType(state)}
      />
    </>
  );
}
