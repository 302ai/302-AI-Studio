import { Textarea } from "@renderer/components/ui/textarea";
import { useTranslation } from "react-i18next";

export function ChatInput() {
  const { t } = useTranslation();

  return (
    <Textarea
      className="mx-auto min-h-36 w-full max-w-2xl px-4"
      placeholder={t("chat.input-placeholder")}
      aria-label={t("chat.input-label")}
      resize="none"
    />
  );
}
