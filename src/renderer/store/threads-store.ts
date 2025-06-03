import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ThreadStore {
  activeThreadId: string | null;
  generatingThreadIds: Set<string>;

  setActiveThreadId: (id: string) => void;
}

export const useThreadsStore = create<ThreadStore>()(
  immer((set) => ({
    activeThreadId: null,
    generatingThreadIds: new Set(),

    setActiveThreadId: (id) =>
      set((state) => {
        if (state.activeThreadId === id) return;
        state.activeThreadId = id;

        return state;
      }),
  }))
);
