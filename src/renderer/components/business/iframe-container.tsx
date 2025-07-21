import { useIframeManager } from "@renderer/hooks/use-iframe-manager";

export function IframeContainer() {
  const { containerRef, isIframeActive } = useIframeManager();

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        display: isIframeActive ? "block" : "none",
      }}
    />
  );
}
