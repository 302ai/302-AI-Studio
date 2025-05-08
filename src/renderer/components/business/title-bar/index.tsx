import { FiSettings } from "react-icons/fi";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import { FaRegSquarePlus } from "react-icons/fa6";
import { Button } from "@renderer/components/ui/button";
import {
  TitlebarLeft,
  TitlebarCenter,
  TitlebarRight,
  TitlebarContainer,
} from "@renderer/components/business/title-bar/title-bar-container";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { isMac } from "@renderer/config/constant";
import { Separator } from "@renderer/components/ui/separator";
import { BrowserTabs } from "../browser-tab";
import {
  useBrowserTabStore,
  TabType,
} from "@renderer/store/browser-tab/browser-tab-store";
import { nanoid } from "nanoid";
import { useTranslation } from "react-i18next";

const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function BasicTitleBar() {
  const { t } = useTranslation();
  const { toggleSidebar, state } = useSidebar();
  const { addTab, addSettingsTab } = useBrowserTabStore();

  const handleSettingsClick = () => {
    addSettingsTab({
      id: nanoid(),
      title: t("settings.tab-title"),
      message: "",
      type: TabType.settings,
    });
  };

  const handleAddNewTab = () => {
    addTab({
      id: nanoid(),
      title: t("thread.new-thread-title"),
      message: "",
      type: TabType.thread,
    });
  };

  return (
    <TitlebarContainer>
      <TitlebarLeft
        className={cn(
          "flex flex-row items-center justify-end gap-2 px-2",
          "transition-[width] duration-200 ease-linear",
          "border border-t-0 border-r-0 border-b-0 border-l-0",
          state === "expanded"
            ? "w-[var(--sidebar-width)] border-r border-r-[color-mix(in_oklch,var(--color-sidebar)_25%,black_6%)] dark:border-r-[color-mix(in_oklch,var(--color-sidebar)_55%,white_10%)]"
            : isMac
              ? "w-[var(--sidebar-width-dock)]"
              : "w-[var(--sidebar-width-collapsed)]",
        )}
      >
        <Button
          className="size-8"
          intent="plain"
          size="square-petite"
          style={noDragRegion}
          onClick={toggleSidebar}
        >
          {state === "collapsed" ? (
            <LuPanelLeftOpen className="h-4 w-4" />
          ) : (
            <LuPanelLeftClose className="h-4 w-4" />
          )}
        </Button>
        <Button
          className="size-8"
          intent="plain"
          size="square-petite"
          style={noDragRegion}
          onClick={handleAddNewTab}
        >
          <FaRegSquarePlus className="h-4 w-4" />
        </Button>
      </TitlebarLeft>

      <Separator
        orientation="vertical"
        className={cn("h-[20px] w-[1px]", state === "expanded" ? "hidden" : "")}
      />

      <TitlebarCenter>
        <BrowserTabs />
      </TitlebarCenter>

      <TitlebarRight>
        <Button
          className="size-8"
          intent="plain"
          size="square-petite"
          style={noDragRegion}
          onClick={handleSettingsClick}
        >
          <FiSettings className="h-4 w-4" />
        </Button>
      </TitlebarRight>
    </TitlebarContainer>
  );
}
