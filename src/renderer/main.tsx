import ReactDom from "react-dom/client";
import React from "react";
import { App } from "./App";
import "./i18n";
import "./globals.css";

ReactDom.createRoot(document.querySelector("app") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
