import { Route } from "react-router-dom";
import { Router } from "@lib/electron-router-dom";
import { HomePage } from "./pages/home/homepage";

export function AppRoutes() {
  return <Router main={<Route path="/" element={<HomePage />} />} />;
}
