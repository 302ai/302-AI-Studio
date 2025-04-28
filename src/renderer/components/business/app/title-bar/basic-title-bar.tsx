import { FiSettings } from "react-icons/fi";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import { FaRegSquarePlus } from "react-icons/fa6";
import { Button } from "@renderer/components/ui/button";
import {
  TitlebarLeft,
  TitlebarCenter,
  TitlebarRight,
  TitlebarContainer,
} from "@renderer/components/business/app/title-bar/title-bar-container";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { isMac } from "@renderer/config/constant";

const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function BasicTitleBar() {
  const navigate = useNavigate();
  const { toggleSidebar, state } = useSidebar();

  const handleSettingsClick = () => {
    return;
    navigate("/settings");
  };

  return (
    <TitlebarContainer>
      <TitlebarLeft
        className={cn(
          "flex flex-row items-center justify-end",
          "transition-[width] duration-200 ease-linear",
          state === "expanded"
            ? "w-[var(--sidebar-width)]"
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
        <Button intent="plain" size="square-petite" style={noDragRegion}>
          <FaRegSquarePlus className="h-4 w-4" />
        </Button>
      </TitlebarLeft>

      <TitlebarCenter>
        <h1>Title</h1>
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
