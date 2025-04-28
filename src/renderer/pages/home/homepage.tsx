import { useEffect } from "react";

// The "api" comes from the context bridge in preload/index.ts
const { api } = window;

export function HomePage() {
  useEffect(() => {
    // check the console on dev tools
    api.sayHelloFromBridge();
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-col">
        <h1>Home Page</h1>
      </div>
    </div>
  );
}
