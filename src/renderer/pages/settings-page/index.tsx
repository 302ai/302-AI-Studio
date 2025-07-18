import { Tab, TabList, Tabs } from "@renderer/components/business/setting-tabs";
import { useSidebar } from "@renderer/components/ui/sidebar";
import logger from "@renderer/config/logger";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AboutSettings } from "./about-settings";
import { GeneralSettings } from "./general-settings";
import { ModelSettings } from "./model-settings";
import { PreferenceSettings } from "./preference-settings";
import { ShortcutsSettings } from "./shortcuts-settings";

const { uiService } = window.service;

export function SettingsPage() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings",
  });
  const navigate = useNavigate();
  const location = useLocation();

  const { state, toggleSidebar } = useSidebar();

  const settingTabs = useMemo(
    () => [
      {
        name: "general-settings",
        path: "/settings/general-settings",
        label: t("general-settings.name"),
      },
      {
        name: "preference-settings",
        path: "/settings/preference-settings",
        label: t("preference-settings.name"),
      },
      {
        name: "model-settings",
        path: "/settings/model-settings",
        label: t("model-settings.name"),
      },
      {
        name: "shortcuts-settings",
        path: "/settings/shortcuts-settings",
        label: t("shortcuts-settings.name"),
      },
      {
        name: "about-settings",
        path: "/settings/about-settings",
        label: t("about-settings.name"),
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

  useEffect(() => {
    if (state === "expanded") {
      toggleSidebar();
    }

    return () => {
      uiService.getSidebarCollapsed().then((sidebarCollapsed) => {
        logger.info("SettingsPage:sidebarCollapsed", { sidebarCollapsed });
        if (!sidebarCollapsed) {
          toggleSidebar();
        }
      });
    };
  }, [state, toggleSidebar]);

  return (
    <div className="flex h-full flex-row">
      <Tabs
        className="w-auto min-w-[var(--setting-width)] justify-end bg-setting"
        orientation="vertical"
        aria-label="Setting Tabs"
        onSelectionChange={handleTabSelect}
        selectedKey={selectedTabKey()}
      >
        <div className="flex w-full justify-end p-3">
          <TabList
            className="w-full gap-y-1 border-none"
            aria-label="Setting Tab List"
            items={settingTabs}
          >
            {(tab) => (
              <Tab
                className="rounded-lg transition-none"
                key={tab.name}
                id={tab.name}
              >
                <span className="w-full text-right">{tab.label}</span>
              </Tab>
            )}
          </TabList>
        </div>
      </Tabs>

      <Routes>
        <Route path="/general-settings" element={<GeneralSettings />} />
        <Route path="/preference-settings" element={<PreferenceSettings />} />
        <Route path="/model-settings" element={<ModelSettings />} />
        <Route path="/shortcuts-settings" element={<ShortcutsSettings />} />
        <Route path="/about-settings" element={<AboutSettings />} />
      </Routes>
    </div>
  );
}
