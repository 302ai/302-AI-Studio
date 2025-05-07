import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { v4 as uuidv4 } from "uuid";

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
};

interface BrowserTabStore {
  tabs: TabItem[];
  setTabs: (tabs: TabItem[]) => void;

  activeTabId: string;
  setActiveTabId: (id: string) => void;

  isLoaded: boolean;
  setIsLoaded: (isLoaded: boolean) => void;

  addTab: (tab: TabItem) => void;
  updateTab: (id: string, data: Partial<TabItem>) => void;
  removeTab: (id: string) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;

  addSettingsTab: () => void;
}

export const useBrowserTabStore = create<BrowserTabStore>()(
  persist(
    immer((set) => ({
      tabs: [],
      setTabs: (tabs) => set({ tabs }),

      activeTabId: "",
      setActiveTabId: (id) => set({ activeTabId: id }),

      isLoaded: false,
      setIsLoaded: (isLoaded) => set({ isLoaded }),

      addTab: (tab) =>
        set((state) => {
          state.tabs.push(tab);
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

      addSettingsTab: () =>
        set((state) => {
          const existingSettingsTab = state.tabs.find(
            (tab) => tab.type === TabType.settings
          );
          if (existingSettingsTab) {
            state.activeTabId = existingSettingsTab.id;
            return state;
          }

          const newTab = {
            id: uuidv4(),
            title: "Settings",
            message: "",
            type: TabType.settings,
          };
          state.tabs.push(newTab);
          state.activeTabId = newTab.id;
          return state;
        }),
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
