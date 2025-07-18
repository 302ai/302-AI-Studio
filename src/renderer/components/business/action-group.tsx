import { CardAction } from "@renderer/components/ui/card";
import { cn } from "@renderer/lib/utils";
import { CircleX, PencilLine, Star } from "lucide-react";
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
              stared ? "fill-yellow-500 text-yellow-500" : "",
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
          <PencilLine className="size-4" />
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
          <CircleX className="size-4" />
        </ButtonWithTooltip>
      )}
    </CardAction>
  );
}
