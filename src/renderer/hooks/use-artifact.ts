import { EventNames, emitter } from "@renderer/services/event-service";
import { useEffect, useState } from "react";

export function useArtifact() {
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);

  useEffect(() => {
    const unsubs = [
      emitter.on(EventNames.CODE_PREVIEW_OPEN, () => {
        setIsArtifactOpen(true);
      }),
      emitter.on(EventNames.CODE_PREVIEW_CLOSE, () => {
        setIsArtifactOpen(false);
      }),
      emitter.on(EventNames.TAB_CLOSE_ALL, () => {
        setIsArtifactOpen(false);
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  return {
    isArtifactOpen,
  };
}
