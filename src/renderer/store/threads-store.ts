import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { ThreadItem } from "@renderer/types/threads";

const THREADS_STORAGE_KEY = "threads";

interface ThreadStore {
  threads: ThreadItem[];
  activeThreadId: string;

  setThreads: (threads: ThreadItem[]) => void;
  addThread: (thread: Partial<ThreadItem>) => void;
  updateThread: (id: string, data: Partial<ThreadItem>) => void;
  removeThread: (id: string) => void;
  setActiveThreadId: (id: string) => void;
}

const { threadsService } = window.service;

export const useThreadsStore = create<ThreadStore>()(
  persist(
    immer((set) => ({
      threads: [],
      activeThreadId: "",

      setThreads: (threads) => set({ threads }),

      addThread: (thread) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            threads: [
              ...state.threads,
              {
                ...thread,
                createdAt: now,
                updatedAt: now,
              },
            ],
          };
        }),

      updateThread: (id, data) =>
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === id
              ? {
                  ...thread,
                  ...data,
                  updatedAt: new Date().toISOString(),
                }
              : thread
          ),
        })),

      removeThread: (id) =>
        set((state) => ({
          threads: state.threads.filter((thread) => thread.id !== id),
        })),

      setActiveThreadId: (id) =>
        set((state) => {
          if (state.activeThreadId === id) return;

          threadsService.setActiveThread(id);
          state.activeThreadId = id;
          return state;
        }),
    })),
    {
      name: THREADS_STORAGE_KEY,
    }
  )
);
