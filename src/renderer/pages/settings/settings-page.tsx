import { Routes, Route, Link } from "react-router-dom";
import { GeneralSettings } from "./general-settings";
import { ModelSettings } from "./model-settings";
import { HelpPanel } from "./help";
import { Tab } from "@renderer/components/ui/tab";
import { TabList } from "@renderer/components/ui/tab";
import { Tabs } from "@renderer/components/ui/tab";

const settingTabs = [
  { id: 1, name: "general settings", path: "/settings/general-settings" },
  {
    id: 2,
    name: "model settings",
    path: "/settings/model-settings",
  },
  {
    id: 3,
    name: "help panel",
    path: "/settings/help-panel",
  },
];

export function SettingsPage() {
  return (
    <div className="flex flex-row">
      <Tabs
        orientation="vertical"
        aria-label="Setting Tabs"
        className="w-[var(--setting-tabs-width)]"
      >
        <TabList aria-label="Setting Tab List">
          {settingTabs.map((tab) => (
            <Tab key={tab.id}>
              <Link to={tab.path}>{tab.name}</Link>
            </Tab>
          ))}
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
