import { useEffect } from "react";
import { BasicTitleBar } from "@renderer/components/business/app/title-bar/basic-title-bar";
import { AppSidebar } from "@renderer/components/business/app/sidebar/app-sidebar";

// The "api" comes from the context bridge in preload/index.ts
const { api } = window;

export function HomePage() {
  useEffect(() => {
    // check the console on dev tools
    api.sayHelloFromBridge();
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BasicTitleBar />

      <AppSidebar />
    </div>
  );
}
