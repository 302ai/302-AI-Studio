import { ButtonWithTooltip } from "@renderer/components/business/button-with-tooltip";
import { SidebarController } from "@renderer/components/business/sidebar/sidebar-controller";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { usePrivacyMode } from "@renderer/hooks/use-privacy-mode";
import { cn } from "@renderer/lib/utils";
import { Ghost } from "lucide-react";
import { useTranslation } from "react-i18next";

export function HomePageTitleBar() {
  const { t } = useTranslation("translation", {
    keyPrefix: "privacy-mode",
  });
  const { state } = useSidebar();
  const { privacyState, togglePrivacyMode } = usePrivacyMode();
  const isSidebarCollapsed = state === "collapsed";

  const handlePrivacyToggle = async () => {
    await togglePrivacyMode();
  };

  return (
    <div className="absolute top-0 left-0 z-10 flex w-full flex-row items-center gap-x-2 p-3">
      {isSidebarCollapsed && <SidebarController />}
      {privacyState.canToggle && (
        <ButtonWithTooltip
          tooltipPlacement="bottom"
          title={
            privacyState.isPrivate ? t("disable-tooltip") : t("enable-tooltip")
          }
          className={cn(
            "ml-auto size-8 transition-all duration-200",
            privacyState.isPrivate
              ? "bg-primary text-primary-fg hover:bg-primary/90 hover:text-primary-fg/90"
              : "",
          )}
          onPress={handlePrivacyToggle}
        >
          <Ghost className="size-5" />
        </ButtonWithTooltip>
      )}
    </div>
  );
}
