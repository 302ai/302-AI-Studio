import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "../../button-with-tooltip";

interface MessageActionsProps {
  onEdit: () => void;
}

export function MessageActions({ onEdit }: MessageActionsProps) {
  const { t } = useTranslation("translation", { keyPrefix: "message" });

  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
      <ButtonWithTooltip
        onClick={onEdit}
        className="text-muted-fg hover:text-fg"
        title={t("edit")}
        tooltipPlacement="bottom"
      >
        <SquarePen className="h-4 w-4" />
      </ButtonWithTooltip>
    </div>
  );
}
