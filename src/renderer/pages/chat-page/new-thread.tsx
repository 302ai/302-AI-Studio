import BlurText from "@renderer/components/business/blur-text";
import { ChatInput } from "@renderer/components/business/chat-input";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

export function NewThread() {
  const { t } = useTranslation("translation", {
    keyPrefix: "new-thread",
  });
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-6 p-6">
      <BlurText
        text={t("hello-world")}
        animateBy="letters"
        className="max-w-[720px] justify-center text-[34px]"
        delay={50}
      />
      <motion.div
        layoutId="chat-input"
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="mx-auto w-full max-w-[720px]"
      >
        <ChatInput />
      </motion.div>
    </div>
  );
}
