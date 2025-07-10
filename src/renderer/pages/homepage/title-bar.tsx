import { SidebarController } from "@renderer/components/business/sidebar/sidebar-controller";
import { useSidebar } from "@renderer/components/ui/sidebar";

export function HomePageTitleBar() {
  const { state } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";

  return (
    <div className="absolute top-0 left-0 z-10 flex flex-row items-center gap-x-2 p-2">
      {isSidebarCollapsed && <SidebarController />}
    </div>
  );
}
