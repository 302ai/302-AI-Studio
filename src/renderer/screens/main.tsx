import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppBar } from "@renderer/components/app-bar";

// The "api" comes from the context bridge in preload/index.ts
const { api } = window;

export function MainScreen() {
  const { t } = useTranslation();

  useEffect(() => {
    // check the console on dev tools
    api.sayHelloFromBridge();
  }, []);

  return (
    <main className="flex h-screen flex-col">
      <AppBar />
    </main>
  );
}
