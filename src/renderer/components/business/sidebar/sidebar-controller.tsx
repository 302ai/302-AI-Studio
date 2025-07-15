import { ButtonWithTooltip } from "@renderer/components/business/button-with-tooltip";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SidebarController() {
  const { t } = useTranslation("translation", {
    keyPrefix: "sidebar",
  });
  const { toggleSidebar, state } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";

  return (
    <ButtonWithTooltip
      className="shrink-0"
      title={
        isSidebarCollapsed
          ? t("open-sidebar.tooltip")
          : t("close-sidebar.tooltip")
      }
      tooltipPlacement="bottom"
      onClick={toggleSidebar}
    >
      {isSidebarCollapsed ? (
        <PanelLeftOpen className="size-5" />
      ) : (
        <PanelLeftClose className="size-5" />
      )}
    </ButtonWithTooltip>
  );
}
