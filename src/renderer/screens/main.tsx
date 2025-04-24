import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppBar } from "@/renderer/components/app-bar";
// The "App" comes from the context bridge in preload/index.ts
const { App } = window;

export function MainScreen() {
  const { t } = useTranslation();

  useEffect(() => {
    // check the console on dev tools
    App.sayHelloFromBridge();
  }, []);

  return (
    <main className="flex h-screen flex-col">
      <AppBar />
    </main>
  );
}
