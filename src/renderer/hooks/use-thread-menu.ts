import { useState } from "react";
import { MenuModelAction } from "@renderer/components/business/sidebar/thread-menu";
import { ThreadItem } from "../types/threads";
import { useThreadsStore } from "../store/threads-store";
import { EventNames, emitter } from "../services/event-service";

export function useThreadMenu(thread: ThreadItem) {
  const { updateThread } = useThreadsStore();

  const [state, setState] = useState<MenuModelAction | null>(null);
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
    console.log("delete");
    closeModal();
  };

  const handleCollectThread = () => {
    console.log("collect thread");
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
