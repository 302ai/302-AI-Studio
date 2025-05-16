import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@renderer/components/ui/context-menu";
import { Pencil, Eraser, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ModalAction } from "./model-action";
import { ThreadItem } from "@/src/renderer/types/threads";

export enum ThreadMenuAction {
  Rename = "rename",
  CleanMessages = "clean-messages",
  Delete = "delete",
}

interface ThreadMenuProps {
  thread: ThreadItem;
  executeAction: (action: string) => void;
}

export function ThreadMenu({ thread, executeAction }: ThreadMenuProps) {
  const { t } = useTranslation();

  const [state, setState] = useState<ThreadMenuAction | null>(null);

  const closeModal = () => setState(null);

  const actionType = (action: ThreadMenuAction | null) => {
    const initialsState = {
      title: "",
      description: "",
      confirmText: "",
      action: () => {},
    };

    switch (action) {
      case ThreadMenuAction.Rename:
        return {
          title: t("thread-menu.actions.rename.title"),
          description: t("thread-menu.actions.rename.description"),
          confirmText: t("thread-menu.actions.rename.confirmText"),
          action: () => executeAction(action),
        };

      case ThreadMenuAction.CleanMessages:
        return {
          title: t("thread-menu.actions.clean-messages.title"),
          description: t("thread-menu.actions.clean-messages.description"),
          confirmText: t("thread-menu.actions.clean-messages.confirmText"),
          action: () => executeAction(action),
        };

      case ThreadMenuAction.Delete:
        return {
          title: t("thread-menu.actions.delete.title"),
          description: t("thread-menu.actions.delete.description"),
          confirmText: t("thread-menu.actions.delete.confirmText"),
          action: () => executeAction(action),
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
        <ContextMenuContent>
          <ContextMenuItem onAction={() => setState(ThreadMenuAction.Rename)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.rename")}
          </ContextMenuItem>
          <ContextMenuItem
            onAction={() => setState(ThreadMenuAction.CleanMessages)}
          >
            <Eraser className="mr-2 h-4 w-4" />
            {t("sidebar.menu-item.clean-messages")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            isDanger={true}
            onAction={() => setState(ThreadMenuAction.Delete)}
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
