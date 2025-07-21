import { CardAction } from "@renderer/components/ui/card";
import { cn } from "@renderer/lib/utils";
import { PenLine, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "./button-with-tooltip";

interface ActionGroupProps {
  className?: string;
  size?: "md" | "xs" | "sq-xs" | "sm" | "lg" | "sq-sm" | "sq-md" | "sq-lg";
  isCircle?: boolean;
  stared?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
}

export function ActionGroup({
  className,
  isCircle = false,
  stared = false,
  onEdit,
  onDelete,
  onStar,
}: ActionGroupProps) {
  const { t } = useTranslation();

  return (
    <CardAction
      className={cn("flex h-full items-center justify-center", className)}
    >
      {/* Star */}
      {onStar && (
        <ButtonWithTooltip
          className="rounded-lg"
          title={t("settings.model-settings.model-provider.star")}
          intent="plain"
          size="sq-xs"
          isCircle={isCircle}
          onClick={onStar}
        >
          <Star
            className={cn(
              "size-4",
              stared
                ? "fill-yellow-500 text-yellow-500"
                : "fill-[#E5E5E5] text-[#E5E5E5] dark:fill-[#5C5C5C] dark:text-[#5C5C5C]",
            )}
          />
        </ButtonWithTooltip>
      )}

      {/* Edit */}
      {onEdit && (
        <ButtonWithTooltip
          className="rounded-lg"
          title={t("settings.model-settings.model-provider.edit")}
          intent="plain"
          size="sq-xs"
          isCircle={isCircle}
          onClick={onEdit}
        >
          {/* <SquarePen className="size-4" /> */}
          <PenLine className="size-4" strokeWidth={1.5} />
        </ButtonWithTooltip>
      )}

      {/* Delete */}
      {onDelete && (
        <ButtonWithTooltip
          className="rounded-lg"
          title={t("settings.model-settings.model-provider.delete")}
          intent="plain"
          size="sq-xs"
          isCircle={isCircle}
          onClick={onDelete}
        >
          <Trash2 className="size-4 text-danger-fg-2" />
        </ButtonWithTooltip>
      )}
    </CardAction>
  );
}
