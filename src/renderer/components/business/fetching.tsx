import { Waveform } from "ldrs/react";
import "ldrs/react/Waveform.css";

export function Fetching() {
  return (
    <div className="flex size-full items-center justify-center text-muted-fg">
      <Waveform color="currentColor" />
    </div>
  );
}
