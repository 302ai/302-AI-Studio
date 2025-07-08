import { useEffect } from "react";
import { initTriplitClient, triplitClient } from "./client";
import { SidebarProvider } from "./components/ui/sidebar";
import { ThemeProvider } from "./context/theme-provider";
import { Routes } from "./routes";
import logger from "@shared/logger/renderer-logger";

const { triplitService } = window.service;

export function App() {
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
    };

    setupClient();
  }, []);

  return (
    <ThemeProvider>
      <SidebarProvider>
        <Routes />
      </SidebarProvider>
    </ThemeProvider>
  );
}
