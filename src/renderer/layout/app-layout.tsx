import { AppSidebar } from "@renderer/components/business/sidebar";
import { BasicTitleBar } from "@renderer/components/business/title-bar";
import { Toast } from "@renderer/components/ui/toast";
import { Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const location = useLocation();
  const isSettingsPage = location.pathname.startsWith("/settings");

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Toast />
      <BasicTitleBar />
      <div className="flex flex-1">
        {!isSettingsPage ? (
          <AppSidebar>
            <div className="size-full">
              <Outlet />
            </div>
          </AppSidebar>
        ) : (
          <div className="size-full">
            <Outlet />
          </div>
        )}
      </div>
    </main>
  );
}
