import { PropsWithChildren, HTMLAttributes } from "react";
import { isWindows } from "@renderer/config/constant";
import { cn } from "@renderer/lib/utils";

export function NavbarContainer({
  children,
  ...props
}: PropsWithChildren & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-row items-center",
        isWindows ? "pr-36" : "pr-12",
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function NavbarLeft({ children, ...props }) {
  return <NavbarContainer {...props}>{children}</NavbarContainer>;
}

export function NavbarCenter({ children, ...props }) {
  return <NavbarContainer {...props}>{children}</NavbarContainer>;
}

export function NavbarRight({ children, ...props }) {
  return <NavbarContainer {...props}>{children}</NavbarContainer>;
}
