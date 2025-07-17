import BlurText from "@renderer/components/business/blur-text";
import { ChatInput } from "@renderer/components/business/chat-input";
import { Toolbox } from "@renderer/components/business/toolbox";
import { Label } from "@renderer/components/ui/field";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

export function NewThread() {
  const { t } = useTranslation("translation", {
    keyPrefix: "new-thread",
  });

  return (
    <div className="mx-auto flex h-full flex-1 flex-col items-center justify-center gap-y-4">
      <div className="flex w-[720px] flex-col gap-y-9">
        <BlurText
          text={t("hello-world")}
          animateBy="letters"
          className="justify-center text-[34px]"
          delay={50}
        />

        <motion.div
          layoutId="chat-input"
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="mx-auto w-full"
        >
          <ChatInput />
        </motion.div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <Label>{t("toolbox-label")}</Label>
        <div className="flex w-full justify-end">
          <Toolbox />
        </div>
      </div>
    </div>
  );
}
