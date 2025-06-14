import { Hatch } from "ldrs/react";
import "ldrs/react/Hatch.css";

export function Fetching() {
  return (
    <div className="flex size-full items-center justify-center">
      <Hatch color="currentColor" />
    </div>
  );
}
