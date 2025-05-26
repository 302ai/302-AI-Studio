import { CardAction } from "@renderer/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { Star, CircleX, PencilLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@renderer/lib/utils";

interface ActionGroupProps {
  className?: string;
  size?: "medium" | "large" | "square-petite" | "extra-small" | "small";
  shape?: "square" | "circle";
  onEdit: () => void;
  onDelete: () => void;
  onStar?: () => void;
}

export function ActionGroup({
  className,
  size = "square-petite",
  shape = "square",
  onEdit,
  onDelete,
  onStar,
}: ActionGroupProps) {
  const { t } = useTranslation();

  return (
    <>
      <CardAction className={cn("flex items-center gap-1", className)}>
        {/* Star */}
        {onStar && (
          <Tooltip>
            <TooltipTrigger
              intent="plain"
              size={size}
              shape={shape}
              onClick={onStar}
            >
              <Star className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              {t("settings.model-settings.model-provider.star")}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Edit */}
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

        {/* Delete */}
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
      </CardAction>
    </>
  );
}
