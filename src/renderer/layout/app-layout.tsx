import { PrivacyModeConfirmDialog } from "@renderer/components/business/privacy-mode-confirm-dialog";
import { AppSidebar } from "@renderer/components/business/sidebar";
import { BasicTitleBar } from "@renderer/components/business/title-bar";
import { Toast } from "@renderer/components/ui/toast";
import { useAppShortcutListenser } from "@renderer/hooks/use-app-shortcut-listener";
import { useShortcutsHandlers } from "@renderer/hooks/use-global-shortcuts";
import { Outlet } from "react-router-dom";

export function Layout() {
  // 初始化全局所有按键处理程序
  useShortcutsHandlers();
  // 初始化仅限于APP内的按键监听
  useAppShortcutListenser();

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden">
      <Toast />
      <PrivacyModeConfirmDialog />
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
