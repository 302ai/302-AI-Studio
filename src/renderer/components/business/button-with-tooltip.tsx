import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { cn } from "@renderer/lib/utils";
import type { ButtonProps } from "../ui/button1";

interface ButtonWithTooltipProps extends ButtonProps {
  className?: string;
  title: string;
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
  tooltipDelay?: number;
  showArrow?: boolean;
  children: React.ReactNode;
}

export function ButtonWithTooltip({
  className,
  title,
  tooltipPlacement,
  tooltipDelay,
  showArrow,
  children,
  ...buttonProps
}: ButtonWithTooltipProps) {
  const {
    intent = "plain",
    size = "square-petite",
    shape = "square",
    ...rest
  } = buttonProps;

  return (
    <Tooltip delay={tooltipDelay}>
      <TooltipTrigger
        className={cn("size-8", className)}
        intent={intent}
        shape={shape}
        size={size}
        {...rest}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent placement={tooltipPlacement} showArrow={showArrow}>
        {title}
      </TooltipContent>
    </Tooltip>
  );
}
