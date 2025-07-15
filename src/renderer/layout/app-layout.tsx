import { AppSidebar } from "@renderer/components/business/sidebar";
import { BasicTitleBar } from "@renderer/components/business/title-bar";
import { Toast } from "@renderer/components/ui/toast";
import { useShortcutsHandlers } from "@renderer/hooks/use-global-shortcuts";
import { Outlet } from "react-router-dom";

export function Layout() {
  // 初始化全局所有按键处理程序
  useShortcutsHandlers();

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden">
      <Toast />
      <BasicTitleBar />
      <div
        className="flex flex-1"
        style={{ height: "calc(100% - var(--title-bar-height))" }}
      >
        <AppSidebar>
          <div className="size-full">
            <Outlet />
          </div>
        </AppSidebar>
      </div>
    </main>
  );
}
