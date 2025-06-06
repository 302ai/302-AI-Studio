import { cleanMessagesByThreadId } from "@renderer/services/db-service/messages-db-service";
import {
  deleteThread,
  updateThread,
} from "@renderer/services/db-service/threads-db-service";
import type { Thread } from "@shared/triplit/types";
import { useState } from "react";
import { EventNames, emitter } from "../services/event-service";
import { useActiveThread } from "./use-active-thread";

export type MenuModelActionType = "rename" | "clean-messages" | "delete";

export function useThreadMenu(thread: Thread) {
  const [state, setState] = useState<MenuModelActionType | null>(null);
  const [newTitle, setNewTitle] = useState(thread.title);
  const { activeThreadId, setActiveThreadId } = useActiveThread();

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

  const handleCleanMessages = async () => {
    await cleanMessagesByThreadId(thread.id);

    closeModal();
  };

  const handleDelete = async () => {
    const isActiveThread = activeThreadId === thread.id;

    await deleteThread(thread.id);
    await cleanMessagesByThreadId(thread.id);

    if (isActiveThread) {
      await setActiveThreadId("");
    }

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
