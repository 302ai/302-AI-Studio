import { BasicTitleBar } from "@renderer/components/business/title-bar";
import { AppSidebar } from "@renderer/components/business/sidebar";
import { Outlet } from "react-router-dom";

// interface LayoutProps {
//   children: React.ReactNode;
// }

export function Layout() {
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <BasicTitleBar />
      <div className="flex min-h-0 flex-1">
        <AppSidebar>
          <div className="flex-1">
            <Outlet />
          </div>
        </AppSidebar>
      </div>
    </main>
  );
}
