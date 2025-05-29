import type { ThreadItem } from "@shared/types/thread";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const THREADS_STORAGE_KEY = "threads";

interface ThreadStore {
  threads: ThreadItem[];
  activeThreadId: string;

  setThreads: (threads: ThreadItem[]) => void;
  addThread: (data: { id: string; title: string }) => void;
  updateThread: (id: string, data: Partial<ThreadItem>) => void;
  removeThread: (id: string) => void;
  setActiveThreadId: (id: string) => void;
}

const { threadsService } = window.service;

export const useThreadsStore = create<ThreadStore>()(
  persist(
    immer((set, get) => ({
      threads: [],
      activeThreadId: "",

      setThreads: (threads) => set({ threads }),

      addThread: (data) =>
        set((state) => {
          const now = new Date().toISOString();
          const { id, title } = data;
          const newThread = {
            id,
            title,
            createdAt: now,
            updatedAt: now,
            isCollected: false,
          };
          const newThreads = [...get().threads, newThread];
          const sortedThreads = newThreads.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          state.threads = sortedThreads;
          state.activeThreadId = newThread.id;
          return state;
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
