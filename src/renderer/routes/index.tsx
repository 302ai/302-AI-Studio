import { Route } from "react-router-dom";
import { HomePage } from "../pages/home/homepage";
import { SettingsPage } from "../pages/settings/settings-page";
import { Layout } from "../layout/app-layout";
import { Router } from "@lib/electron-router-dom";

export function Routes() {
  return (
    <Router
      main={
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
        </Route>
      }
    />
  );
}
