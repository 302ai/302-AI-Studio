import { PropsWithChildren, HTMLAttributes } from "react";
import { isMac, isWindows } from "@renderer/config/constant";
import { cn } from "@renderer/lib/utils";

type Props = PropsWithChildren & HTMLAttributes<HTMLDivElement>;

const dragRegion = { WebkitAppRegion: "drag" } as React.CSSProperties;

export function TitlebarContainer({ children, ...props }: Props) {
  return (
    <div
      className={cn(
        "flex min-w-full flex-row items-center bg-navbar",
        "max-h-[var(--title-bar-height)] min-h-[var(--title-bar-height)]",
        isMac ? "pl-[140px]" : "",
      )}
      style={dragRegion}
      {...props}
    >
      {children}
    </div>
  );
}

export function TitlebarLeft({ children, ...props }: Props) {
  return (
    <div className="flex min-w-[275px] flex-row items-center px-2.5" {...props}>
      {children}
    </div>
  );
}

export function TitlebarCenter({ children, ...props }: Props) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center font-bold",
        isMac ? "px-5" : "px-0",
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TitlebarRight({ children, ...props }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-end pl-3",
        isWindows ? "pr-[140px]" : "pr-3",
      )}
      {...props}
    >
      {children}
    </div>
  );
}
