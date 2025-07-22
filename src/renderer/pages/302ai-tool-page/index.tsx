import { LdrsLoader } from "@renderer/components/business/ldrs-loader";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { useEffect } from "react";

const { uiService } = window.service;

export function AI302ToolPage() {
  const { state, toggleSidebar } = useSidebar();

  useEffect(() => {
    if (state === "expanded") {
      toggleSidebar();
    }

    return () => {
      uiService.getSidebarCollapsed().then((sidebarCollapsed) => {
        if (!sidebarCollapsed) {
          toggleSidebar();
        }
      });
    };
  }, [state, toggleSidebar]);

  return (
    <div className="flex h-full items-center justify-center">
      <LdrsLoader type="waveform" size={36} />
    </div>
  );
}
