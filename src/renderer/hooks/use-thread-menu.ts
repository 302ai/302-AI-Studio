import type { Thread } from "@shared/triplit/types";
import { useState } from "react";
import { EventNames, emitter } from "../services/event-service";
import { useActiveThread } from "./use-active-thread";

export type MenuModelActionType = "rename" | "clean-messages" | "delete";

const { threadService, messageService } = window.service;

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
    await threadService.updateThread(thread.id, {
      title: formattedTitle,
    });

    emitter.emit(EventNames.THREAD_RENAME, {
      threadId: thread.id,
      newTitle: formattedTitle,
    });

    closeModal();
  };

  const handleCleanMessages = async () => {
    await messageService.cleanMessagesByThreadId(thread.id);

    closeModal();
  };

  const handleDelete = async () => {
    if (isActiveThread) {
      await setActiveThreadId("");
    }

    await threadService.deleteThread(thread.id);
    await messageService.cleanMessagesByThreadId(thread.id);

    emitter.emit(EventNames.THREAD_DELETE, {
      threadId: thread.id,
    });

    closeModal();
  };

  const handleCollectThread = async () => {
    await threadService.updateThread(thread.id, {
      collected: !thread.collected,
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
