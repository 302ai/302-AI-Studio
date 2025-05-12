import { Textarea } from "@renderer/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { ToolBar } from "./tool-bar";
import { cn } from "@/src/renderer/lib/utils";

interface ChatInputProps {
  className?: string;
}

export function ChatInput({ className }: ChatInputProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "mx-auto flex max-h-60 min-h-36 w-full max-w-2xl flex-col rounded-[20px] border pt-2 pr-2 pb-0 pl-4",
        "focus-within:border-ring/70 focus-within:outline-hidden focus-within:ring-1 focus-within:ring-ring/20",
        className,
      )}
    >
      <Textarea
        className={cn(
          "h-full min-h-[calc(100%-var(--chat-input-toolbar-height))] w-full rounded-none border-0 bg-transparent p-0",
          "shadow-none ring-0",
        )}
        placeholder={t("chat.input-placeholder")}
        aria-label={t("chat.input-label")}
        resize="none"
      />

      <ToolBar />
    </div>
  );
}
