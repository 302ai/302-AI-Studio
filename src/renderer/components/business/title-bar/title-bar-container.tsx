import { isLinux, isMac, isWindows } from "@renderer/config/constant";
import { cn } from "@renderer/lib/utils";
import { EventNames, emitter } from "@renderer/services/event-service";
import {
  type HTMLAttributes,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";

type Props = PropsWithChildren & HTMLAttributes<HTMLDivElement>;

interface TitlebarProps extends Props {
  className?: string;
}

const dragRegion = { WebkitAppRegion: "drag" } as React.CSSProperties;

export function TitlebarContainer({ children, ...props }: TitlebarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMacWindowMaximizeStatusUpdate = useCallback(
    (data: { isMaximized: boolean }) => {
      setIsMaximized(data.isMaximized);
    },
    [],
  );

  useEffect(() => {
    const unsub = emitter.on(
      EventNames.WINDOW_MAC_FULLSCREEN_STATE_UPDATE,
      handleMacWindowMaximizeStatusUpdate,
    );

    return () => unsub();
  }, [handleMacWindowMaximizeStatusUpdate]);

  return (
    <div
      className={cn(
        "flex w-full flex-row items-center border-b border-b-border bg-navbar pl-[10px]",
        "transition-all duration-200 ease-in-out",
        isMac ? `pl-[${isMaximized ? "10px" : "75px"}]` : "",
      )}
      style={dragRegion}
      {...props}
    >
      {children}
    </div>
  );
}

export function TitlebarLeft({ children, className, ...props }: TitlebarProps) {
  return (
    <div
      className={cn(
        "flex h-[var(--title-bar-height)] shrink-0 flex-row items-center",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TitlebarCenter({
  children,
  className,
  ...props
}: TitlebarProps) {
  return (
    <div
      className={cn(
        "flex h-[var(--title-bar-height)] flex-1 items-center overflow-hidden px-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TitlebarRight({
  children,
  className,
  ...props
}: TitlebarProps) {
  return (
    <div
      className={cn(
        "flex h-[var(--title-bar-height)] items-center justify-end",
        isWindows ? "pr-[140px]" : isLinux ? "pr-[100px]" : "pr-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
