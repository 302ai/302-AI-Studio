import { IconSidebar } from "@intentui/icons";
import { useSidebar } from "@renderer/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
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
        <IconSidebar style={{ height: "1.5rem", width: "1.5rem" }} />
      </TooltipTrigger>
      <TooltipContent>
        {isSidebarCollapsed
          ? t("open-sidebar.tooltip")
          : t("close-sidebar.tooltip")}
      </TooltipContent>
    </Tooltip>
  );
}
