import { useEffect } from "react";
import { Navbar } from "@renderer/pages/home/nav-bar/nav-bar";

// The "api" comes from the context bridge in preload/index.ts
const { api } = window;

export function HomePage() {
  useEffect(() => {
    // check the console on dev tools
    api.sayHelloFromBridge();
  }, []);

  return (
    <main className="flex h-screen flex-col">
      <Navbar />
    </main>
  );
}
