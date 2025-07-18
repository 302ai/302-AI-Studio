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
      client.onConnectionStatusChange((status) => {
        logger.info("Connection status changed", {
          status,
          process: "renderer",
        });
        setIsConnected(status === "OPEN");
      });
      const serverUrl = await triplitService.getServerPort();
      client.updateServerUrl(`http://localhost:${serverUrl}`);
      await client.connect();

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
    return null;
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Routes />
      </SidebarProvider>
    </ThemeProvider>
  );
}
