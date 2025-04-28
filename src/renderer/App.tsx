import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/home/homepage";
import { SettingsPage } from "./pages/settings/settings-page";
import { SidebarProvider } from "./components/ui/sidebar";

export function App() {
  return (
    <SidebarProvider>
      <HashRouter>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </HashRouter>
    </SidebarProvider>
  );
}
