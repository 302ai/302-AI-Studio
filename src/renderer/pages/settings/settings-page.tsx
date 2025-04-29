import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { GeneralSettings } from "./general-settings";
import { ModelSettings } from "./model-settings";
import { HelpPanel } from "./help";
import { Tab, TabList, Tabs } from "@renderer/components/ui/tab";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const settingTabs = useMemo(
    () => [
      {
        name: "general-settings",
        path: "/settings/general-settings",
        label: t("settings.general-settings"),
      },
      {
        name: "model-settings",
        path: "/settings/model-settings",
        label: t("settings.model-settings"),
      },
      {
        name: "help-panel",
        path: "/settings/help-panel",
        label: t("settings.help-panel"),
      },
    ],
    [t],
  );

  const handleTabSelect = (key: React.Key) => {
    const tab = settingTabs.find((tab) => tab.name === key);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <div className="flex h-full flex-row gap-x-2">
      <Tabs
        className="w-[var(--setting-tab-list-width)] justify-end rounded-[10px] bg-setting-tab-list"
        orientation="vertical"
        aria-label="Setting Tabs"
        onSelectionChange={handleTabSelect}
      >
        <TabList
          className="w-full border-none"
          aria-label="Setting Tab List"
          items={settingTabs}
        >
          {(tab) => (
            <Tab key={tab.name} id={tab.name}>
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
