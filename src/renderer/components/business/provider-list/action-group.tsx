import { CircleX, PencilLine } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@renderer/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { CardAction } from "@renderer/components/ui/card";

export function ActionGroup() {
  const { t } = useTranslation();

  return (
    <CardAction className="flex items-center gap-1">
      {/* Edit Provider */}
      <Tooltip>
        <TooltipTrigger
          className="size-9"
          intent="plain"
          size="square-petite"
          onClick={() => {}}
        >
          <PencilLine className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          {t("settings.model-settings.model-provider.edit")}
        </TooltipContent>
      </Tooltip>

      {/* Delete Provider */}
      <Tooltip>
        <TooltipTrigger
          className="size-9"
          intent="plain"
          size="square-petite"
          onClick={() => {}}
        >
          <CircleX className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          {t("settings.model-settings.model-provider.delete")}
        </TooltipContent>
      </Tooltip>
    </CardAction>
  );
}
