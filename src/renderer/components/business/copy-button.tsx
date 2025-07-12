import { useCopyToClipboard } from "@renderer/hooks/use-copy-to-clipboard";
import { cn } from "@renderer/lib/utils";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "./button-with-tooltip";

interface CopyButtonProps {
  content: string;
  tooltipPlacement?: "top" | "bottom" | "left" | "right";
  tooltipDelay?: number;
  showArrow?: boolean;
  className?: string;
}

export function CopyButton({
  content,
  className,
  tooltipPlacement,
  tooltipDelay,
  showArrow,
}: CopyButtonProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "common",
  });
  const { isCopied, handleCopy } = useCopyToClipboard({
    text: content,
  });

  return (
    <ButtonWithTooltip
      type="button"
      intent="plain"
      tooltipPlacement={tooltipPlacement}
      tooltipDelay={tooltipDelay}
      showArrow={showArrow}
      className={cn("relative size-8", className)}
      onClick={handleCopy}
      title={t("copy-to-clipboard")}
    >
      <Check
        className={cn(
          "absolute inset-0 m-auto h-4 w-4 transition-all duration-200 ease-in-out",
          isCopied ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
      <Copy
        className={cn(
          "absolute inset-0 m-auto h-4 w-4 transition-all duration-200 ease-in-out",
          isCopied ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
    </ButtonWithTooltip>
  );
}
