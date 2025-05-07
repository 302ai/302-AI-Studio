import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/home/homepage";
import { SettingsPage } from "./pages/settings/settings-page";
import { SidebarProvider } from "./components/ui/sidebar";
import { Layout } from "./layout/app-layout";
import { ThemeProvider } from "./context/theme-provider";

export function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route index element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/settings/*" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </HashRouter>
      </SidebarProvider>
    </ThemeProvider>
  );
}
