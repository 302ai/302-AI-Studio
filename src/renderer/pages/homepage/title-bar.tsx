import { IconSidebar } from "@intentui/icons";
import { useSidebar } from "@renderer/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export function HomePageTitleBar() {
  const { t } = useTranslation();
  const { toggleSidebar, state } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";

  return (
    <div className="flex flex-row items-center gap-x-2 p-2">
      <Tooltip>
        <TooltipTrigger
          className="size-7"
          intent="plain"
          size="square-petite"
          onClick={toggleSidebar}
        >
          <IconSidebar style={{ height: "1.5rem", width: "1.5rem" }} />
        </TooltipTrigger>
        <TooltipContent>
          {isSidebarCollapsed
            ? t("sidebar.open-sidebar.tooltip")
            : t("sidebar.close-sidebar.tooltip")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
