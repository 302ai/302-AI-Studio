import { CardAction } from "@renderer/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";
import { CircleX, PencilLine } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ActionGroupProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function ActionGroup({ onEdit, onDelete }: ActionGroupProps) {
  const { t } = useTranslation();

  return (
    <>
      <CardAction className="flex items-center gap-1">
        {/* Edit Provider */}
        <Tooltip>
          <TooltipTrigger
            className="size-9"
            intent="plain"
            size="square-petite"
            onClick={onEdit}
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
