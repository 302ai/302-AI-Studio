import { cleanMessagesByThreadId } from "@renderer/services/db-services/messages-db-service";
import {
  deleteThread,
  updateThread,
} from "@renderer/services/db-services/threads-db-service";
import type { Thread } from "@shared/triplit/types";
import { useState } from "react";
import { EventNames, emitter } from "../services/event-service";
import { useActiveThread } from "./use-active-thread";

export type MenuModelActionType = "rename" | "clean-messages" | "delete";

export function useThreadMenu(thread: Thread) {
  const [state, setState] = useState<MenuModelActionType | null>(null);
  const [newTitle, setNewTitle] = useState(thread.title);
  const { activeThreadId, setActiveThreadId } = useActiveThread();

  const isActiveThread = activeThreadId === thread.id;

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
    if (isActiveThread) {
      await setActiveThreadId("");
    }

    await deleteThread(thread.id);
    await cleanMessagesByThreadId(thread.id);

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
