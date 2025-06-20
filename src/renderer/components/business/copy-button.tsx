import { useCopyToClipboard } from "@renderer/hooks/use-copy-to-clipboard";
import { cn } from "@renderer/lib/utils";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "./button-with-tooltip";

interface CopyButtonProps {
  content: string;
}

export function CopyButton({ content }: CopyButtonProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "common",
  });
  const { isCopied, handleCopy } = useCopyToClipboard({
    text: content,
  });

  return (
    <ButtonWithTooltip
      type="button"
      intent="secondary"
      shape="square"
      className="relative size-8"
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
