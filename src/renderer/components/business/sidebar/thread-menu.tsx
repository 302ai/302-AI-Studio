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
import type { ThreadItem } from "@shared/types/thread";
import { Eraser, Package, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ModalAction } from "../modal-action";

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
          action: handleRename,
          disabled: formattedTitle.length === 0,
        };

      case "clean-messages":
        return {
          title: t("thread-menu.actions.clean-messages.title"),
          descriptions: [t("thread-menu.actions.clean-messages.description")],
          confirmText: t("thread-menu.actions.clean-messages.confirmText"),
          action: handleCleanMessages,
        };

      case "delete":
        return {
          title: t("thread-menu.actions.delete.title"),
          descriptions: [t("thread-menu.actions.delete.description")],
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
          <ContextMenuItem onAction={() => setState("rename")}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.rename")}
          </ContextMenuItem>
          <ContextMenuItem onAction={() => setState("clean-messages")}>
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
          <ContextMenuItem isDanger={true} onAction={() => setState("delete")}>
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
