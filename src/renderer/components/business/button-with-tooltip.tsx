import { Button, type ButtonProps } from "@renderer/components/ui/button";
import { Tooltip } from "@renderer/components/ui/tooltip";
import { cn } from "@renderer/lib/utils";

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
  tooltipDelay = 100,
  showArrow = false,
  children,
  ...buttonProps
}: ButtonWithTooltipProps) {
  const {
    intent = "plain",
    size = "sq-md",
    isCircle = false,
    ...rest
  } = buttonProps;

  return (
    <Tooltip delay={tooltipDelay}>
      <Button
        intent={intent}
        size={size}
        isCircle={isCircle}
        className={cn("rounded-[10px]", className)}
        {...rest}
      >
        {children}
      </Button>
      <Tooltip.Content
        placement={tooltipPlacement}
        showArrow={showArrow}
        intent="inverse"
      >
        {title}
      </Tooltip.Content>
    </Tooltip>
  );
}
