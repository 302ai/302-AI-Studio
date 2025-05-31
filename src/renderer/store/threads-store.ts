import type { ThreadItem, ThreadSetting } from "@shared/types/thread";
import { current } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ThreadStore {
  threads: ThreadItem[];
  activeThreadId: string | null;
  generatingThreadIds: Set<string>;
  threadMap: Record<string, ThreadItem>;

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
  immer((set) => ({
    threads: [],
    activeThreadId: null,
    generatingThreadIds: new Set(),
    threadMap: {},

    initializeStore: async () => {
      const threads = await threadsService.getThreads();
      const threadMap = threads.reduce((acc, thread) => {
        acc[thread.id] = thread;
        return acc;
      }, {} as Record<string, ThreadItem>);

      set({
        threads,
        threadMap,
      });
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
        const newThreads = [...current(state.threads), newThread];
        const sortedThreads = newThreads.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        state.threads = sortedThreads;
        state.activeThreadId = newThread.id;
        state.threadMap[id] = newThread;

        return state;
      });

      return newThread;
    },

    updateThread: (id, data) => {
      set((state) => {
        const existingThread = current(state.threadMap)[id];
        if (!existingThread) return state;

        const updatedThread = {
          ...existingThread,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        state.threads = state.threads.map((thread) =>
          thread.id === id ? updatedThread : thread
        );
        state.threadMap[id] = updatedThread;

        return state;
      });

      threadsService.updateThread(id, data);
    },

    removeThread: (id) => {
      set((state) => {
        state.threads = state.threads.filter((thread) => thread.id !== id);
        delete state.threadMap[id];

        return state;
      });

      threadsService.deleteThread(id);
    },

    setActiveThreadId: (id) =>
      set((state) => {
        if (state.activeThreadId === id) return;
        state.activeThreadId = id;

        return state;
      }),
  }))
);

useThreadsStore.getState().initializeStore();
