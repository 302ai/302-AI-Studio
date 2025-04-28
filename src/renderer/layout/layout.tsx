import { BasicTitleBar } from "@renderer/components/business/app/title-bar/basic-title-bar";
import { AppSidebar } from "@renderer/components/business/app/sidebar/app-sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BasicTitleBar />
      <div className="flex min-h-0 flex-1">
        <AppSidebar>
          <main className="min-w-0 flex-1">{children}</main>
        </AppSidebar>
      </div>
    </div>
  );
}
