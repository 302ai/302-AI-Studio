import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/home/homepage";
import { SettingsPage } from "./pages/settings/settings-page";
import { SidebarProvider } from "./components/ui/sidebar";
import { Layout } from "./layout/app-layout";

export function App() {
  return (
    <SidebarProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </SidebarProvider>
  );
}
