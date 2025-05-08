import { Route } from "react-router-dom";
import { HomePage } from "./pages/home/homepage";
import { SettingsPage } from "./pages/settings/settings-page";
import { SidebarProvider } from "./components/ui/sidebar";
import { Layout } from "./layout/app-layout";
import { ThemeProvider } from "./context/theme-provider";
import { Router } from "@lib/electron-router-dom";

export function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Router
          main={
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/settings/*" element={<SettingsPage />} />
            </Route>
          }
        />
      </SidebarProvider>
    </ThemeProvider>
  );
}
