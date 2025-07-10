import ReactDom from "react-dom/client";
import { App } from "./App";
import "./i18n";
import "./globals.css";
import "katex/dist/katex.min.css";

ReactDom.createRoot(document.querySelector("app") as HTMLElement).render(
  <App />,
);
