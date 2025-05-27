import { Tab, TabList, Tabs } from "@renderer/components/ui/tab";
import { useTranslation } from "react-i18next";

interface ModelFilterProps {
  onTabChange: (key: React.Key) => void;
}

export function ModelFilter({ onTabChange }: ModelFilterProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-list",
  });

  return (
    <Tabs
      aria-label="Model List Tabs"
      orientation="horizontal"
      onSelectionChange={onTabChange}
    >
      <TabList className="px-3 pt-2 pb-0" aria-label="Model List Tabs List">
        <Tab
          className="cursor-pointer group-data-[orientation=horizontal]/tabs:pb-2"
          key="current"
          id="current"
        >
          {t("current")}
        </Tab>
        <Tab
          className="cursor-pointer group-data-[orientation=horizontal]/tabs:pb-2"
          key="collected"
          id="collected"
        >
          {t("collected")}
        </Tab>
      </TabList>
    </Tabs>
  );
}
