import {
  TitlebarCenter,
  TitlebarContainer,
  TitlebarRight,
} from "@renderer/components/business/title-bar/title-bar-container";
import { Separator } from "@renderer/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { useTabBar } from "@renderer/hooks/use-tab-bar";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TabBar } from "../tab-bar";
import { ThreadSearcher } from "./thread-searcher";

const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function BasicTitleBar() {
  const { t } = useTranslation();
  const { handleAddNewTab } = useTabBar();

  const [isOpen, setIsOpen] = useState(false);

  const handleSearchThread = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <TitlebarContainer>
        <TitlebarCenter>
          <TabBar />
        </TitlebarCenter>

        <Separator orientation="vertical" className="mx-1 h-[20px] w-[1px]" />

        <TitlebarRight>
          <Tooltip>
            <TooltipTrigger
              className="size-8"
              intent="plain"
              size="square-petite"
              style={noDragRegion}
              onClick={() => handleAddNewTab("setting")}
            >
              <Settings className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{t("settings.icon-tooltip")}</TooltipContent>
          </Tooltip>
        </TitlebarRight>
      </TitlebarContainer>

      <ThreadSearcher
        isOpenSearcher={isOpen}
        onOpenChange={handleSearchThread}
      />
    </>
  );
}
