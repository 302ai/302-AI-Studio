import { useEffect } from "react";
import { BasicNavBar } from "@renderer/components/business/app/nav-bar/basic-nav-bar";

// The "api" comes from the context bridge in preload/index.ts
const { api } = window;

export function HomePage() {
  useEffect(() => {
    // check the console on dev tools
    api.sayHelloFromBridge();
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <BasicNavBar />
      <div className="flex flex-col">
        <h1>Home</h1>
      </div>
    </div>
  );
}
