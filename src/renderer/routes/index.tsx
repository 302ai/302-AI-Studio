import { Router } from "@lib/electron-router-dom";
import { Route } from "react-router-dom";
import { Layout } from "../layout/app-layout";
import { AI302ToolPage } from "../pages/302ai-tool-page";
import { HomePage } from "../pages/homepage";
import { SettingsPage } from "../pages/settings-page";

export function Routes() {
  return (
    <Router
      main={
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/302ai-tool/:subdomain" element={<AI302ToolPage />} />
        </Route>
      }
    />
  );
}
