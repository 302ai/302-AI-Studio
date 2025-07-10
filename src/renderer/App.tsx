import logger from "@shared/logger/renderer-logger";
import { useEffect } from "react";
import { initTriplitClient, triplitClient } from "./client";
import { SidebarProvider } from "./components/ui/sidebar";
import { ThemeProvider } from "./context/theme-provider";
import { useAppShortcutListenser } from "./hooks/use-app-shortcut-listener";
import { Routes } from "./routes";
import {
  cleanupIpcEventBridge,
  setupIpcEventBridge,
} from "./services/ipc-event-bridge";

const { triplitService } = window.service;

export function App() {
  // 初始化仅限于APP内的按键监听
  useAppShortcutListenser();

  useEffect(() => {
    const setupClient = async () => {
      const client = initTriplitClient();
      const serverUrl = await triplitService.getServerPort();
      client.updateServerUrl(`http://localhost:${serverUrl}`);
      client.connect();

      logger.info("App: Client connected", {
        serverUrl: triplitClient.serverUrl,
        process: "renderer",
      });

      // Setup IPC event bridge
      setupIpcEventBridge();
    };

    setupClient();

    // Cleanup on unmount
    return () => {
      cleanupIpcEventBridge();
    };
  }, []);

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Routes />
      </SidebarProvider>
    </ThemeProvider>
  );
}
