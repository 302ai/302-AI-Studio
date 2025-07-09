import { AppSidebar } from "@renderer/components/business/sidebar";
import { BasicTitleBar } from "@renderer/components/business/title-bar";
import { Toast } from "@renderer/components/ui/toast";
import { useGlobalShortcuts } from "@renderer/hooks/use-global-shortcuts";
import { Outlet } from "react-router-dom";

export function Layout() {
  // Initialize global shortcuts
  useGlobalShortcuts();

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Toast />
      <BasicTitleBar />
      <div className="flex flex-1">
        <AppSidebar>
          <div className="size-full">
            <Outlet />
          </div>
        </AppSidebar>
      </div>
    </main>
  );
}
