import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@renderer/components/ui/context-menu";
import { Pencil, Eraser, Package, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ModalAction } from "./model-action";
import { ThreadItem } from "@/src/renderer/types/threads";
import { TextField } from "@renderer/components/ui/text-field";
import { useThreadMenu } from "@/src/renderer/hooks/use-thread-menu";

export enum MenuModelAction {
  Rename = "rename",
  CleanMessages = "clean-messages",
  Delete = "delete",
}

interface ThreadMenuProps {
  thread: ThreadItem;
}

export function ThreadMenu({ thread }: ThreadMenuProps) {
  const { t } = useTranslation();

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
  } = useThreadMenu(thread);

  const actionType = (action: MenuModelAction | null) => {
    const initialsState = {
      title: "",
      description: "",
      confirmText: "",
      action: () => {},
    };

    switch (action) {
      case MenuModelAction.Rename:
        return {
          title: t("thread-menu.actions.rename.title"),
          description: t("thread-menu.actions.rename.description"),
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
          action: handleRename,
          disabled: formattedTitle.length === 0,
        };

      case MenuModelAction.CleanMessages:
        return {
          title: t("thread-menu.actions.clean-messages.title"),
          description: t("thread-menu.actions.clean-messages.description"),
          confirmText: t("thread-menu.actions.clean-messages.confirmText"),
          action: handleCleanMessages,
        };

      case MenuModelAction.Delete:
        return {
          title: t("thread-menu.actions.delete.title"),
          description: t("thread-menu.actions.delete.description"),
          confirmText: t("thread-menu.actions.delete.confirmText"),
          action: handleDelete,
        };
      default:
        return initialsState;
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="w-full cursor-pointer px-2 py-1.5 text-left">
          {thread.title}
        </ContextMenuTrigger>
        <ContextMenuContent aria-label={`Thread options for ${thread.title}`}>
          <ContextMenuItem onAction={() => setState(MenuModelAction.Rename)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.rename")}
          </ContextMenuItem>
          <ContextMenuItem
            onAction={() => setState(MenuModelAction.CleanMessages)}
          >
            <Eraser className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.clean-messages")}
          </ContextMenuItem>
          <ContextMenuItem onAction={handleCollectThread}>
            <Package className="mr-2 h-4 w-4" />
            {thread.isCollected
              ? t("sidebar.menu-item.uncollect-thread")
              : t("sidebar.menu-item.collect-thread")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            isDanger={true}
            onAction={() => setState(MenuModelAction.Delete)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.delete")}
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
