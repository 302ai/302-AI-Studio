import { useCallback, useEffect, useRef } from "react";
import { useActiveTab } from "./use-active-tab";

const iframeCache = new Map<string, HTMLIFrameElement>();

export function useIframeManager() {
  const { activeTab } = useActiveTab();
  const containerRef = useRef<HTMLDivElement>(null);

  const createIframe = useCallback((subdomain: string): HTMLIFrameElement => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://${subdomain}.302.ai`;
    iframe.className = "h-full w-full absolute top-0 left-0";
    iframe.title = "302AI Tool";
    iframe.allow = `accelerometer;
        autoplay;
        camera;
        clipboard-read;
        clipboard-write;
        encrypted-media;
        fullscreen;
        geolocation;
        gyroscope;
        magnetometer;
        microphone;
        midi;
        payment;
        picture-in-picture;
        speaker;
        usb;
        xr-spatial-tracking;
        screen-wake-lock;
        sync-xhr;
        gamepad;
        hid;
        idle-detection;
        serial;
        clipboard-sanitized-write;
        bluetooth`;

    return iframe;
  }, []);

  const getOrCreateIframe = useCallback(
    (subdomain: string): HTMLIFrameElement => {
      const cacheKey = `302ai-tool-${subdomain}`;
      let iframe = iframeCache.get(cacheKey);

      if (!iframe) {
        iframe = createIframe(subdomain);
        iframeCache.set(cacheKey, iframe);

        if (containerRef.current) {
          containerRef.current.appendChild(iframe);
        }
      }

      return iframe;
    },
    [createIframe],
  );

  const hideAllIframes = useCallback(() => {
    iframeCache.forEach((iframe) => {
      iframe.style.display = "none";
    });
  }, []);

  const showIframe = useCallback(
    (subdomain: string) => {
      const iframe = getOrCreateIframe(subdomain);
      iframe.style.display = "block";
    },
    [getOrCreateIframe],
  );

  const extractSubdomain = useCallback((path: string): string | null => {
    const match = path.match(/\/302ai-tool\/(.+)/);
    return match ? match[1] : null;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    hideAllIframes();

    if (activeTab?.type === "302ai-tool" && activeTab.path) {
      const subdomain = extractSubdomain(activeTab.path);
      if (subdomain) {
        showIframe(subdomain);
      }
    }
  }, [activeTab, hideAllIframes, showIframe, extractSubdomain]);

  const isIframeActive = activeTab?.type === "302ai-tool";

  return {
    containerRef,
    isIframeActive,
    hideAllIframes,
    showIframe,
    extractSubdomain,
  };
}
