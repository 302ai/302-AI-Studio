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
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { isMac } from "@renderer/config/constant";
import { Separator } from "@renderer/components/ui/separator";
import { BrowserTabs } from "../browser-tab";
import {
  useBrowserTabStore,
  TabType,
} from "@renderer/store/browser-tab/browser-tab-store";
import { v4 as uuidv4 } from "uuid";

const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function BasicTitleBar() {
  const navigate = useNavigate();
  const { toggleSidebar, state } = useSidebar();
  const { addTab, addSettingsTab } = useBrowserTabStore();

  const handleSettingsClick = () => {
    navigate("/settings/general-settings");
    addSettingsTab();
  };

  const handleAddNewTab = async () => {
    const newId = uuidv4();
    const newTab = {
      id: newId,
      title: "New Tab",
      message: "This is a new tab content",
      type: TabType.thread,
    };

    addTab(newTab);
  };

  return (
    <TitlebarContainer>
      <TitlebarLeft
        className={cn(
          "flex flex-row items-center justify-end",
          "transition-[width] duration-200 ease-linear",
          state === "expanded"
            ? "w-[var(--sidebar-width)] border-r border-r-border"
            : isMac
              ? "w-[var(--sidebar-width-dock)]"
              : "w-[var(--sidebar-width-collapsed)]",
        )}
      >
        <Button
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
        className={cn(
          "h-[16.88px] w-[1.53px]",
          state === "expanded" ? "hidden" : "",
        )}
      />

      <TitlebarCenter>
        <BrowserTabs />
      </TitlebarCenter>

      <TitlebarRight>
        <Button
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
