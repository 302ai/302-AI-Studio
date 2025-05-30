import type { ThreadItem, ThreadSetting } from "@shared/types/thread";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ThreadStore {
  threads: ThreadItem[];
  activeThreadId: string;
  generatingThreadIds: Set<string>;

  initializeStore: () => Promise<void>;

  setThreads: (threads: ThreadItem[]) => void;
  addThread: (data: {
    id: string;
    title: string;
    settings: ThreadSetting;
  }) => ThreadItem;
  updateThread: (id: string, data: Partial<ThreadItem>) => void;
  removeThread: (id: string) => void;
  setActiveThreadId: (id: string) => void;
}

const { threadsService } = window.service;

export const useThreadsStore = create<ThreadStore>()(
  immer((set, get) => ({
    threads: [],
    activeThreadId: "",
    generatingThreadIds: new Set(),

    initializeStore: async () => {
      const threads = await threadsService.getThreads();
      set({ threads });
    },

    setThreads: (threads) => set({ threads }),

    addThread: (data) => {
      const now = new Date().toISOString();
      const { id, title, settings } = data;
      const newThread = {
        id,
        title,
        settings,
        createdAt: now,
        updatedAt: now,
        isCollected: false,
      };

      set((state) => {
        const newThreads = [...get().threads, newThread];
        const sortedThreads = newThreads.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        state.threads = sortedThreads;
        state.activeThreadId = newThread.id;

        return state;
      });

      return newThread;
    },

    updateThread: (id, data) => {
      threadsService.updateThread(id, data);

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
      }));
    },

    removeThread: (id) => {
      threadsService.deleteThread(id);

      set((state) => ({
        threads: state.threads.filter((thread) => thread.id !== id),
      }));
    },

    setActiveThreadId: (id) =>
      set((state) => {
        if (state.activeThreadId === id) return;

        threadsService.setActiveThreadId(id);
        state.activeThreadId = id;
        return state;
      }),
  }))
);

useThreadsStore.getState().initializeStore();
