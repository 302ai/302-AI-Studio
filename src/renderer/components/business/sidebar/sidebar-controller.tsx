import { useSidebar } from "@renderer/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SidebarController() {
  const { t } = useTranslation("translation", {
    keyPrefix: "sidebar",
  });
  const { toggleSidebar, state } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";

  return (
    <Tooltip>
      <TooltipTrigger
        className="size-8"
        intent="plain"
        size="square-petite"
        onClick={toggleSidebar}
      >
        {isSidebarCollapsed ? (
          <PanelLeftOpen className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </TooltipTrigger>
      <TooltipContent placement="bottom">
        {isSidebarCollapsed
          ? t("open-sidebar.tooltip")
          : t("close-sidebar.tooltip")}
      </TooltipContent>
    </Tooltip>
  );
}
