import { isMac, isWindows } from "@renderer/config/constant";
import { cn } from "@renderer/lib/utils";
import type { HTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren & HTMLAttributes<HTMLDivElement>;

interface TitlebarProps extends Props {
  className?: string;
}

const dragRegion = { WebkitAppRegion: "drag" } as React.CSSProperties;

export function TitlebarContainer({ children, ...props }: TitlebarProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center bg-navbar",
        isMac ? "pl-[140px]" : ""
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
        className
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
        "flex h-[var(--title-bar-height)] flex-1 items-center overflow-hidden",
        isMac ? "px-5" : "px-0",
        className
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
        isWindows ? "pr-[140px]" : "pr-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
