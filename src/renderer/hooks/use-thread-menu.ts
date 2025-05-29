import type { ThreadItem } from "@shared/types/thread";
import { useState } from "react";
import { EventNames, emitter } from "../services/event-service";
import { useThreadsStore } from "../store/threads-store";

export type MenuModelActionType = "rename" | "clean-messages" | "delete";

export function useThreadMenu(thread: ThreadItem) {
  const { updateThread, removeThread } = useThreadsStore();

  const [state, setState] = useState<MenuModelActionType | null>(null);
  const [newTitle, setNewTitle] = useState(thread.title);

  const formattedTitle = newTitle.trim();

  const closeModal = () => {
    setState(null);
  };

  const handleRename = () => {
    updateThread(thread.id, { title: formattedTitle });

    emitter.emit(EventNames.THREAD_RENAME, {
      threadId: thread.id,
      newTitle: formattedTitle,
    });

    closeModal();
  };

  const handleCleanMessages = () => {
    closeModal();
  };

  const handleDelete = () => {
    removeThread(thread.id);

    emitter.emit(EventNames.THREAD_DELETE, {
      threadId: thread.id,
    });

    closeModal();
  };

  const handleCollectThread = () => {
    updateThread(thread.id, { isCollected: !thread.isCollected });

    closeModal();
  };

  return {
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
  };
}
