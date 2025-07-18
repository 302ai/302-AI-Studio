import { ButtonWithTooltip } from "@renderer/components/business/button-with-tooltip";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

const { uiService } = window.service;

export function SidebarController() {
  const { t } = useTranslation("translation", {
    keyPrefix: "sidebar",
  });
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleToggleSidebar = async () => {
    toggleSidebar();
    await uiService.updateSidebarCollapsed(!isCollapsed);
  };

  return (
    <ButtonWithTooltip
      className="shrink-0"
      title={
        isCollapsed ? t("open-sidebar.tooltip") : t("close-sidebar.tooltip")
      }
      tooltipPlacement="bottom"
      onClick={handleToggleSidebar}
    >
      {isCollapsed ? (
        <PanelLeftOpen className="size-5" />
      ) : (
        <PanelLeftClose className="size-5" />
      )}
    </ButtonWithTooltip>
  );
}
