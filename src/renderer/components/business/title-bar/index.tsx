import { FiSettings, FiSearch } from "react-icons/fi";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import { FaRegSquarePlus } from "react-icons/fa6";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@renderer/components/ui/tooltip";
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
import { TabBar } from "../tab-bar";
import { useTabBarStore } from "@/src/renderer/store/tab-bar-store";
import { useTranslation } from "react-i18next";
import { ThreadSearcher } from "./thread-searcher";
import { useState } from "react";

const noDragRegion = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function BasicTitleBar() {
  const { t } = useTranslation();
  const { toggleSidebar, state } = useSidebar();
  const { addTab, addSettingsTab } = useTabBarStore();

  const [isOpen, setIsOpen] = useState(false);

  const isSidebarCollapsed = state === "collapsed";

  const handleSettingsClick = () => {
    addSettingsTab({ title: t("settings.tab-title") });
  };

  const handleAddNewTab = () => {
    addTab({ title: t("thread.new-thread-title") });
  };

  const handleSearchThread = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
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
              : "w-[var(--sidebar-width-collapsed)]"
          )}
        >
          {/* Sidebar Toggle */}
          <Tooltip>
            <TooltipTrigger
              className="size-8"
              intent="plain"
              size="square-petite"
              style={noDragRegion}
              onClick={toggleSidebar}
            >
              <LuPanelLeftOpen
                className={cn("h-4 w-4", { hidden: !isSidebarCollapsed })}
              />
              <LuPanelLeftClose
                className={cn("h-4 w-4", { hidden: isSidebarCollapsed })}
              />
            </TooltipTrigger>
            <TooltipContent>
              {isSidebarCollapsed
                ? t("sidebar.open-sidebar.tooltip")
                : t("sidebar.close-sidebar.tooltip")}
            </TooltipContent>
          </Tooltip>

          {/* Search Thread */}
          <Tooltip>
            <TooltipTrigger
              className={cn("size-8", { hidden: isSidebarCollapsed })}
              intent="plain"
              size="square-petite"
              style={noDragRegion}
              onClick={handleSearchThread}
            >
              <FiSearch className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              {t("sidebar.search-thread.tooltip")}
            </TooltipContent>
          </Tooltip>

          {/* Add New Tab */}
          <Tooltip>
            <TooltipTrigger
              className="size-8"
              intent="plain"
              size="square-petite"
              style={noDragRegion}
              onClick={handleAddNewTab}
            >
              <FaRegSquarePlus className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{t("sidebar.new-thread.tooltip")}</TooltipContent>
          </Tooltip>
        </TitlebarLeft>

        <Separator
          orientation="vertical"
          className={cn(
            "h-[20px] w-[1px]",
            state === "expanded" ? "hidden" : ""
          )}
        />

        <TitlebarCenter>
          <TabBar />
        </TitlebarCenter>

        <Separator orientation="vertical" className="mx-2 h-[20px] w-[1px]" />

        <TitlebarRight>
          <Tooltip>
            <TooltipTrigger
              className="size-8"
              intent="plain"
              size="square-petite"
              style={noDragRegion}
              onClick={handleSettingsClick}
            >
              <FiSettings className="h-4 w-4" />
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
