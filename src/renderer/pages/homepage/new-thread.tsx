import logo from "@renderer/assets/llm-icons/logo.png?url";
import { ChatInput } from "@renderer/components/business/chat-input";
import DecryptedText from "@renderer/components/business/decrypted-text";
import { useTranslation } from "react-i18next";

export function NewThread() {
  const { t } = useTranslation("translation", {
    keyPrefix: "new-thread",
  });
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      <div className="flex flex-row items-center justify-center gap-4">
        <img src={logo} alt="logo" className="size-11" />
        {/* <span className="text-3xl">{t("hello-world")}</span> */}
        <DecryptedText
          text={t("hello-world")}
          animateOn="view"
          className="text-4xl"
          parentClassName="text-4xl"
          sequential={true}
        />
      </div>
      <ChatInput />
    </div>
  );
}
