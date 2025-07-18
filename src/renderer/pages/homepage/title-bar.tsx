import { SidebarController } from "@renderer/components/business/sidebar/sidebar-controller";
import { Button } from "@renderer/components/ui/button";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { usePrivacyMode } from "@renderer/hooks/use-privacy-mode";
import { cn } from "@renderer/lib/utils";
import { Ghost } from "lucide-react";

export function HomePageTitleBar() {
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
        <Button
          intent="plain"
          size="sm"
          className={cn(
            "ml-auto p-2 transition-all duration-200",
            privacyState.isPrivate
              ? "bg-primary text-primary-fg hover:bg-primary/90 hover:text-primary-fg/90"
              : "text-muted-foreground hover:text-foreground",
          )}
          onPress={handlePrivacyToggle}
        >
          <Ghost className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
