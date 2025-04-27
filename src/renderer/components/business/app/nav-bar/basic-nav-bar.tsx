import { FiSettings } from "react-icons/fi";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import { FaRegSquarePlus } from "react-icons/fa6";
import { Button } from "@renderer/components/ui/button";
import {
  NavbarLeft,
  NavbarCenter,
  NavbarRight,
} from "@renderer/components/business/app/nav-bar/nav-bar-container";
import { useNavigate } from "react-router-dom";

// CSS classes for drag region
const dragRegion = { WebkitAppRegion: "drag" } as React.CSSProperties;
const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function BasicNavBar() {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <div
      className="flex h-9 flex-shrink-0 select-none flex-row items-center justify-between border-b bg-background"
      style={dragRegion}
    >
      <NavbarLeft className="flex flex-row items-center">
        <Button intent="plain" size="square-petite" style={noDragRegion}>
          <LuPanelLeftClose className="h-4 w-4" />
        </Button>
        <Button intent="plain" size="square-petite" style={noDragRegion}>
          <LuPanelLeftOpen className="h-4 w-4" />
        </Button>
        <Button intent="plain" size="square-petite" style={noDragRegion}>
          <FaRegSquarePlus className="h-4 w-4" />
        </Button>
      </NavbarLeft>

      <NavbarCenter>
        <h1>Title</h1>
      </NavbarCenter>

      <NavbarRight>
        <Button
          intent="plain"
          size="square-petite"
          style={noDragRegion}
          onClick={handleSettingsClick}
        >
          <FiSettings className="h-4 w-4" />
        </Button>
      </NavbarRight>
    </div>
  );
}
