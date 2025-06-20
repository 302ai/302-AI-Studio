import BlurText from "@renderer/components/business/blur-text";
import { ChatInput } from "@renderer/components/business/chat-input";
import { useTranslation } from "react-i18next";

export function NewThread() {
  const { t } = useTranslation("translation", {
    keyPrefix: "new-thread",
  });
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center justify-center gap-4">
        <BlurText
          text={t("hello-world")}
          animateBy="letters"
          className="text-4xl"
          delay={50}
        />
      </div>
      <ChatInput />
    </div>
  );
}
