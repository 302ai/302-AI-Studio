import { formatTimeAgo } from "@renderer/lib/utils";
import type { Message } from "@shared/triplit/types";
import { enUS, ja, zhCN } from "date-fns/locale";
import i18next from "i18next";
import { RefreshCcw, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonWithTooltip } from "../../button-with-tooltip";
import { CopyButton } from "../../copy-button";

const localeMap = { zh: zhCN, en: enUS, ja: ja };

interface MessageActionsProps {
  message: Message;
  onRefresh: () => void;
  onEdit: () => void;
}

export function MessageActions({
  message,
  onRefresh,
  onEdit,
}: MessageActionsProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });

  const currentLanguage = i18next.language;

  if (message.status === "pending") return null;

  return (
    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
      <CopyButton
        tooltipPlacement="bottom"
        content={message.content}
        className="text-muted-fg hover:text-fg"
      />

      <ButtonWithTooltip
        tooltipPlacement="bottom"
        onClick={onRefresh}
        className="text-muted-fg hover:text-fg"
        title={t("refresh")}
      >
        <RefreshCcw className="h-4 w-4" />
      </ButtonWithTooltip>

      <ButtonWithTooltip
        tooltipPlacement="bottom"
        onClick={onEdit}
        className="text-muted-fg hover:text-fg"
        title={t("edit")}
      >
        <SquarePen className="h-4 w-4" />
      </ButtonWithTooltip>

      <div className="ml-2 text-muted-fg text-xs">
        {formatTimeAgo(
          message.createdAt.toISOString(),
          localeMap[currentLanguage],
        )}
      </div>
    </div>
  );
}
