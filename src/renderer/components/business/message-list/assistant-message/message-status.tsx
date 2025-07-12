import { LdrsLoader } from "@renderer/components/business/ldrs-loader";
import { Note } from "@renderer/components/ui/note";
import { useTranslation } from "react-i18next";

interface MessageStatusProps {
  status: string;
}

export function MessageStatus({ status }: MessageStatusProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 text-muted-fg text-sm">
        {t("thinking")}
        <LdrsLoader type="dot-pulse" size={16} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <Note intent="danger" noGroupHover>
        {t("generate-failed")}
      </Note>
    );
  }

  return null;
}
