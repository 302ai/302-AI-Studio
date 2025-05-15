import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";

const BROWSER_TAB_STORAGE_KEY = "browser-tabs";

export enum TabType {
  thread = "thread",
  settings = "settings",
}
export type TabItem = {
  id: string;
  title: string;
  message: string;
  type: TabType;
  favicon?: string;
};

interface BrowserTabStore {
  tabs: TabItem[];
  activeTabId: string;
  activeTabHistory: string[];
  isLoaded: boolean;
  draggingTabId: string | null;

  setActiveTabId: (id: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  addSettingsTab: (data: { title: string }) => void;
  setTabs: (tabs: TabItem[]) => void;
  addTab: (data: { title: string }) => void;
  updateTab: (id: string, data: Partial<TabItem>) => void;
  removeTab: (id: string) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  setDraggingTabId: (id: string | null) => void;
  getActiveTab: () => TabItem | null;
}

export const useBrowserTabStore = create<BrowserTabStore>()(
  persist(
    immer((set, get) => ({
      tabs: [],
      activeTabId: "",
      activeTabHistory: [],
      isLoaded: false,
      draggingTabId: null,

      setTabs: (tabs) => set({ tabs }),

      setActiveTabId: (id) =>
        set((state) => {
          if (state.activeTabId && state.activeTabId !== id) {
            if (state.activeTabHistory.at(-1) !== state.activeTabId) {
              state.activeTabHistory.push(state.activeTabId);
            }

            if (state.activeTabHistory.length > 30) {
              state.activeTabHistory.shift();
            }
          }
          state.activeTabId = id;
          return state;
        }),
      setIsLoaded: (isLoaded) => set({ isLoaded }),

      addTab: (data) =>
        set((state) => {
          const newTab = {
            id: nanoid(),
            title: data.title,
            message: "",
            type: TabType.thread,
          };
          state.tabs.push(newTab);
          state.activeTabHistory.push(newTab.id);
          state.activeTabId = newTab.id;

          return state;
        }),

      updateTab: (id, data) =>
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.id === id);
          if (index !== -1) {
            state.tabs[index] = { ...state.tabs[index], ...data };
          }
          return state;
        }),

      removeTab: (id) =>
        set((state) => {
          const newTabs = state.tabs.filter((tab) => tab.id !== id);
          state.tabs = newTabs;

          if (id === state.activeTabId && newTabs.length > 0) {
            let nextActiveId: string | null = null;
            while (state.activeTabHistory.length > 0) {
              const previousId = state.activeTabHistory.pop();
              if (previousId && newTabs.some((tab) => tab.id === previousId)) {
                nextActiveId = previousId;
                break;
              }
            }

            state.activeTabId = nextActiveId ?? newTabs[0].id;
          }

          if (newTabs.length === 0) {
            state.activeTabId = "";
          }

          return state;
        }),

      moveTab: (fromIndex, toIndex) =>
        set((state) => {
          const tab = state.tabs[fromIndex];
          state.tabs.splice(fromIndex, 1);
          state.tabs.splice(toIndex, 0, tab);
          return state;
        }),

      addSettingsTab: (data) =>
        set((state) => {
          const newTab = {
            id: nanoid(),
            title: data.title,
            message: "",
            type: TabType.settings,
          };
          const existingSettingsTab = state.tabs.find(
            (tab) => tab.type === TabType.settings
          );
          if (existingSettingsTab) {
            if (
              state.activeTabId &&
              state.activeTabId !== existingSettingsTab.id
            ) {
              if (state.activeTabHistory.at(-1) !== state.activeTabId) {
                state.activeTabHistory.push(state.activeTabId);
              }
            }
            state.activeTabId = existingSettingsTab.id;
            return state;
          }

          state.tabs.push(newTab);
          state.activeTabId = newTab.id;
          return state;
        }),

      setDraggingTabId: (id) => set({ draggingTabId: id }),

      getActiveTab: () =>
        get().tabs.find((tab) => tab.id === get().activeTabId) ?? null,
    })),
    {
      name: BROWSER_TAB_STORAGE_KEY,
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);
