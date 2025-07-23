import BlurText from "@renderer/components/business/blur-text";
import {
  ChatInput,
  type ChatInputRef,
} from "@renderer/components/business/chat-input";
import { Toolbox } from "@renderer/components/business/toolbox";
import { Label } from "@renderer/components/ui/field";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { useChatInputFocus } from "@renderer/hooks/use-chat-input-focus";
import { useTriplit } from "@renderer/hooks/use-triplit";
import { cn } from "@renderer/lib/utils";
import { motion } from "motion/react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export function NewThread() {
  const { t } = useTranslation("translation", {
    keyPrefix: "new-thread",
  });

  const chatInputRef = useRef<ChatInputRef>(null);
  const { settings } = useTriplit();
  const { isTransitioning } = useSidebar();

  useChatInputFocus(chatInputRef);

  const displayAppStore = settings?.[0]?.displayAppStore;

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
          transition={
            isTransitioning
              ? { duration: 0 }
              : {
                  duration: 0.3,
                  ease: "easeInOut",
                }
          }
          className="mx-auto w-full"
        >
          <ChatInput ref={chatInputRef} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: displayAppStore ? 1 : 0,
          y: displayAppStore ? 0 : 20,
        }}
        transition={{
          duration: 0.3,
          delay: 0.3,
          ease: "easeOut",
        }}
        className={cn("flex w-[720px] flex-col gap-2", {
          "pointer-events-none": !displayAppStore,
        })}
      >
        <Label>{t("toolbox-label")}</Label>
        <div className="flex w-full justify-end">
          <Toolbox />
        </div>
      </motion.div>
    </div>
  );
}
