import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/home/homepage";
import { SettingsPage } from "./pages/settings/settings-page";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  );
}
