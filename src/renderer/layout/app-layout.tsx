import { AppSidebar } from "@renderer/components/business/sidebar";
import { BasicTitleBar } from "@renderer/components/business/title-bar";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <main className="flex h-screen flex-col overflow-hidden">
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
