import {
  Separator as Divider,
  type SeparatorProps as DividerProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

interface SeparatorProps extends DividerProps {
  className?: string;
}

const Separator = ({ className, ...props }: SeparatorProps) => {
  return (
    <Divider
      {...props}
      className={twMerge(
        "shrink-0 bg-border forced-colors:bg-[ButtonBorder]",
        "bg-[color-mix(in_oklch,var(--color-sidebar)_25%,black_6%)]",
        "dark:bg-[color-mix(in_oklch,var(--color-sidebar)_55%,white_10%)]",
        props.orientation === "horizontal" ? "h-px w-full" : "w-px",
        className,
      )}
    />
  );
};

export type { SeparatorProps };
export { Separator };
