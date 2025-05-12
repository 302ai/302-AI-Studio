import { useEffect } from "react";
import { NewThread } from "./new-thread";

// The "api" comes from the context bridge in preload/index.ts
const { api } = window;

export function HomePage() {
  useEffect(() => {
    // check the console on dev tools
    api.sayHelloFromBridge();
  }, []);

  return (
    <div className="flex size-full flex-col items-center justify-center gap-9">
      <NewThread />
    </div>
  );
}
