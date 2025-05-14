import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const THREADS_STORAGE_KEY = "threads";

export type ThreadStatus = "idle" | "working" | "error" | "completed";

interface ThreadStore {
  activeThreadId: string;
  setActiveThreadId: (id: string) => void;
}

export const useThreadsStore = create<ThreadStore>()(
  persist(
    immer((set) => ({
      activeThreadId: "",
      setActiveThreadId: (id) => set({ activeThreadId: id }),
    })),
    {
      name: THREADS_STORAGE_KEY,
    }
  )
);
