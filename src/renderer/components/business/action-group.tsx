import { CardAction } from "@renderer/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { cn } from "@renderer/lib/utils";
import { CircleX, PencilLine, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ActionGroupProps {
  className?: string;
  size?: "medium" | "large" | "square-petite" | "extra-small" | "small";
  shape?: "square" | "circle";
  stared?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
}

export function ActionGroup({
  className,
  size = "square-petite",
  shape = "square",
  stared = false,
  onEdit,
  onDelete,
  onStar,
}: ActionGroupProps) {
  const { t } = useTranslation();

  return (
    <CardAction
      className={cn("flex h-full items-center justify-center gap-1", className)}
    >
      {/* Star */}
      {onStar && (
        <Tooltip>
          <TooltipTrigger
            intent="plain"
            size={size}
            shape={shape}
            onClick={onStar}
          >
            <Star
              className={cn(
                "size-4",
                stared ? "fill-yellow-500 text-yellow-500" : "",
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            {t("settings.model-settings.model-provider.star")}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Edit */}
      {onEdit && (
        <Tooltip>
          <TooltipTrigger
            intent="plain"
            size={size}
            shape={shape}
            onClick={onEdit}
          >
            <PencilLine className="size-4" />
          </TooltipTrigger>
          <TooltipContent>
            {t("settings.model-settings.model-provider.edit")}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Delete */}
      {onDelete && (
        <Tooltip>
          <TooltipTrigger
            intent="plain"
            size={size}
            shape={shape}
            onClick={onDelete}
          >
            <CircleX className="size-4" />
          </TooltipTrigger>
          <TooltipContent>
            {t("settings.model-settings.model-provider.delete")}
          </TooltipContent>
        </Tooltip>
      )}
    </CardAction>
  );
}
