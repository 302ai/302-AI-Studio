import { Button, type ButtonProps } from "@renderer/components/ui/button";
import { Tooltip, TooltipContent } from "@renderer/components/ui/tooltip";

interface ButtonWithTooltipProps extends ButtonProps {
  title: string;
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
  tooltipDelay?: number;
  showArrow?: boolean;
}

const ButtonWithTooltip = ({
  title,
  tooltipPlacement = "top",
  tooltipDelay = 10,
  showArrow = false,
  ...buttonProps
}: ButtonWithTooltipProps) => {
  return (
    <Tooltip delay={tooltipDelay}>
      <Button {...buttonProps} />
      <TooltipContent 
        placement={tooltipPlacement}
        showArrow={showArrow}
        className="text-xs"
      >
        {title}
      </TooltipContent>
    </Tooltip>
  );
};

export type { ButtonWithTooltipProps };
export { ButtonWithTooltip };
