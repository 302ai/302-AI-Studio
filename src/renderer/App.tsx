import logger from "@shared/logger/renderer-logger";
import { useEffect, useState } from "react";
import { initTriplitClient, triplitClient } from "./client";
import { SidebarProvider } from "./components/ui/sidebar";
import { ThemeProvider } from "./context/theme-provider";
import { Routes } from "./routes";
import {
  cleanupIpcEventBridge,
  setupIpcEventBridge,
} from "./services/ipc-event-bridge";

const { triplitService } = window.service;

export function App() {
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    const setupClient = async () => {
      const client = initTriplitClient();
      const serverUrl = await triplitService.getServerPort();
      client.updateServerUrl(`http://localhost:${serverUrl}`);
      client.connect();

      setIsConnected(client.connectionStatus === "OPEN");

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

  if (!isConnected) {
    return <div>Error...</div>;
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Routes />
      </SidebarProvider>
    </ThemeProvider>
  );
}
