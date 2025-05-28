import {
  TitlebarCenter,
  TitlebarContainer,
  TitlebarLeft,
  TitlebarRight,
} from "@renderer/components/business/title-bar/title-bar-container";
import { Separator } from "@renderer/components/ui/separator";
import { useSidebar } from "@renderer/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { isMac } from "@renderer/config/constant";
import { cn } from "@renderer/lib/utils";
import { useTabBarStore } from "@renderer/store/tab-bar-store";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRegSquarePlus } from "react-icons/fa6";
import { FiSearch, FiSettings } from "react-icons/fi";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import { TabBar } from "../tab-bar";
import { ThreadSearcher } from "./thread-searcher";

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
              ? isMac
                ? "w-[calc(var(--sidebar-width)-60px)] border-r border-r-[color-mix(in_oklch,var(--color-sidebar)_25%,black_6%)] dark:border-r-[color-mix(in_oklch,var(--color-sidebar)_55%,white_10%)]"
                : "w-[var(--sidebar-width)] border-r border-r-[color-mix(in_oklch,var(--color-sidebar)_25%,black_6%)] dark:border-r-[color-mix(in_oklch,var(--color-sidebar)_55%,white_10%)]"
              : isMac
                ? "w-[var(--sidebar-width-dock)]"
                : "w-[var(--sidebar-width-collapsed)]",
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
            state === "expanded" ? "hidden" : "",
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
