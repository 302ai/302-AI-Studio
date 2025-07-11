import { LdrsLoader } from "./ldrs-loader";

export function Fetching() {
  return (
    <div className="flex size-full items-center justify-center text-muted-fg">
      <LdrsLoader type="waveform" />
    </div>
  );
}
