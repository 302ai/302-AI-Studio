import { useEffect } from "react";
import { initTriplitClient, triplitClient } from "./client";
import { SidebarProvider } from "./components/ui/sidebar";
import { ThemeProvider } from "./context/theme-provider";
import { Routes } from "./routes";

const { triplitService } = window.service;

export function App() {
  useEffect(() => {
    const setupClient = async () => {
      const client = initTriplitClient();
      const serverUrl = await triplitService.getServerPort();
      client.updateServerUrl(`http://localhost:${serverUrl}`);
      client.connect();

      console.log("client (renderer process)", triplitClient.serverUrl);
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
