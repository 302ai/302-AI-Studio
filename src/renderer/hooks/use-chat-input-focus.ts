import type { ChatInputRef } from "@renderer/components/business/chat-input";
import { EventNames, emitter } from "@renderer/services/event-service";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";

interface UseChatInputFocusOptions {
  enabled?: boolean;
  delay?: number;
  focusOnMount?: boolean;
}

export function useChatInputFocus(
  chatInputRef: RefObject<ChatInputRef | null>,
  options: UseChatInputFocusOptions = {},
) {
  const { enabled = true, delay = 100, focusOnMount = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const focusInput = useRef(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }, delay);
  });

  // Update the focus function when delay changes
  useEffect(() => {
    focusInput.current = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }, delay);
    };
  }, [delay, chatInputRef]);

  // Focus on mount (initial load or new thread)
  useEffect(() => {
    if (enabled && focusOnMount) {
      focusInput.current();
    }
  }, [enabled, focusOnMount]);

  useEffect(() => {
    if (!enabled) return;

    const handleTabSelect = () => {
      focusInput.current();
    };

    const unsub = emitter.on(EventNames.TAB_SELECT, handleTabSelect);

    return () => {
      unsub();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled]);

  return {
    focusInput: () => focusInput.current(),
  };
}
