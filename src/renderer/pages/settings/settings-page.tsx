import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { GeneralSettings } from "./general-settings";
import { ModelSettings } from "./model-settings";
import { ToolSettings } from "./tool-settings";
import { AssistantSettings } from "./assistant-settings";
import { Tab, TabList, Tabs } from "@renderer/components/ui/tab";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const settingTabs = useMemo(
    () => [
      {
        name: "general-settings",
        path: "/settings/general-settings",
        label: t("settings.general-settings.name"),
      },
      {
        name: "model-settings",
        path: "/settings/model-settings",
        label: t("settings.model-settings.name"),
      },
      {
        name: "tool-settings",
        path: "/settings/tool-settings",
        label: t("settings.tool-settings.name"),
      },
      {
        name: "assistant-settings",
        path: "/settings/assistant-settings",
        label: t("settings.assistant-settings.name"),
      },
    ],
    [t],
  );

  const selectedTabKey = () => {
    const currentTab = settingTabs.find((tab) =>
      location.pathname.includes(tab.name),
    );
    return currentTab?.name || settingTabs[0].name;
  };

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
        selectedKey={selectedTabKey()}
      >
        <TabList
          className="w-full border-none"
          aria-label="Setting Tab List"
          items={settingTabs}
        >
          {(tab) => (
            <Tab className="cursor-pointer" key={tab.name} id={tab.name}>
              {tab.label}
            </Tab>
          )}
        </TabList>
      </Tabs>

      <div className="h-full flex-1">
        <Routes>
          <Route path="/general-settings" element={<GeneralSettings />} />
          <Route path="/model-settings" element={<ModelSettings />} />
          <Route path="/tool-settings" element={<ToolSettings />} />
          <Route path="/assistant-settings" element={<AssistantSettings />} />
        </Routes>
      </div>
    </div>
  );
}
