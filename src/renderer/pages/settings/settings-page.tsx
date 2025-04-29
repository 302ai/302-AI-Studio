import { Routes, Route, Link } from "react-router-dom";
import { GeneralSettings } from "./general-settings";
import { ModelSettings } from "./model-settings";
import { HelpPanel } from "./help";
import { Tab, TabList, Tabs } from "@renderer/components/ui/tab";

const settingTabs = [
  {
    name: "general-settings",
    path: "/settings/general-settings",
    label: "General Settings",
  },
  {
    name: "model-settings",
    path: "/settings/model-settings",
    label: "Model Settings",
  },
  {
    name: "help-panel",
    path: "/settings/help-panel",
    label: "Help Panel",
  },
];

export function SettingsPage() {
  return (
    <div className="flex h-full flex-row gap-x-2">
      <Tabs
        className="w-[var(--setting-tabs-width)] rounded-[10px] bg-setting-tab-list "
        orientation="vertical"
        aria-label="Setting Tabs"
      >
        <TabList
          className="border-none"
          aria-label="Setting Tab List"
          items={settingTabs}
        >
          {(tab) => (
            <Tab key={tab.name} id={tab.name} className="justify-end">
              <Link to={tab.path} className="w-full text-right">
                {tab.label}
              </Link>
            </Tab>
          )}
        </TabList>
      </Tabs>
      <div className="h-full flex-1">
        <Routes>
          <Route path="/general-settings" element={<GeneralSettings />} />
          <Route path="/model-settings" element={<ModelSettings />} />
          <Route path="/help-panel" element={<HelpPanel />} />
        </Routes>
      </div>
    </div>
  );
}
