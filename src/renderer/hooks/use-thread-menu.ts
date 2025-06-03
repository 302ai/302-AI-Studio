import { triplitClient } from "@shared/triplit/client";
import { updateThread } from "@shared/triplit/helpers";
import type { ThreadItem } from "@shared/types/thread";
import { useState } from "react";
import { EventNames, emitter } from "../services/event-service";

export type MenuModelActionType = "rename" | "clean-messages" | "delete";

export function useThreadMenu(thread: ThreadItem) {
  const [state, setState] = useState<MenuModelActionType | null>(null);
  const [newTitle, setNewTitle] = useState(thread.title);

  const formattedTitle = newTitle.trim();

  const closeModal = () => {
    setState(null);
  };

  const handleRename = async () => {
    await updateThread(thread.id, async (thread) => {
      thread.title = formattedTitle;
    });

    emitter.emit(EventNames.THREAD_RENAME, {
      threadId: thread.id,
      newTitle: formattedTitle,
    });

    closeModal();
  };

  const handleCleanMessages = () => {
    closeModal();
  };

  const handleDelete = async () => {
    await triplitClient.delete("threads", thread.id);

    emitter.emit(EventNames.THREAD_DELETE, {
      threadId: thread.id,
    });

    closeModal();
  };

  const handleCollectThread = async () => {
    await updateThread(thread.id, async (thread) => {
      thread.collected = !thread.collected;
    });

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
