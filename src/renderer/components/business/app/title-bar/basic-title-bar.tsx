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

const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function BasicTitleBar() {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <TitlebarContainer>
      <TitlebarLeft className="flex flex-row items-center">
        <Button intent="plain" size="square-petite" style={noDragRegion}>
          <LuPanelLeftClose className="h-4 w-4" />
        </Button>
        <Button intent="plain" size="square-petite" style={noDragRegion}>
          <LuPanelLeftOpen className="h-4 w-4" />
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
