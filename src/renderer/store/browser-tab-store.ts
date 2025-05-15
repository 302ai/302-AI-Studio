import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const BROWSER_TAB_STORAGE_KEY = "browser-tab";

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
  addSettingsTab: (settingsTab: TabItem) => void;
  setTabs: (tabs: TabItem[]) => void;
  addTab: (tab: TabItem) => void;
  updateTab: (id: string, data: Partial<TabItem>) => void;
  removeTab: (id: string) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  setDraggingTabId: (id: string | null) => void;
}

export const useBrowserTabStore = create<BrowserTabStore>()(
  persist(
    immer((set) => ({
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

      addTab: (tab) =>
        set((state) => {
          state.tabs.push(tab);

          if (state.activeTabId) {
            if (state.activeTabHistory.at(-1) !== tab.id) {
              state.activeTabHistory.push(tab.id);
            }
          }

          state.activeTabId = tab.id;
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
            state.activeTabId = newTabs[0].id;

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

          return state;
        }),

      moveTab: (fromIndex, toIndex) =>
        set((state) => {
          const tab = state.tabs[fromIndex];
          state.tabs.splice(fromIndex, 1);
          state.tabs.splice(toIndex, 0, tab);
          return state;
        }),

      addSettingsTab: (settingsTab) =>
        set((state) => {
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

          state.tabs.push(settingsTab);
          state.activeTabId = settingsTab.id;
          return state;
        }),

      setDraggingTabId: (id) => set({ draggingTabId: id }),
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
