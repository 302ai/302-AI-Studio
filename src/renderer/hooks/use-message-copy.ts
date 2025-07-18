import logger from "@shared/logger/renderer-logger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useMessageCopy() {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation("translation", { keyPrefix: "message" });

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("copy-success"));
    } catch (error) {
      logger.error("复制失败", { error });
      toast.error(t("copy-failed"));
    }
  };

  const handleCopySelected = async () => {
    try {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || "";
      if (selectedText) {
        await navigator.clipboard.writeText(selectedText);
        toast.success(t("copy-success"));
      }
    } catch (error) {
      logger.error("复制选中内容失败", { error });
      toast.error(t("copy-failed"));
    }
  };

  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection?.toString() || "";
  };

  return {
    copied,
    handleCopy,
    handleCopySelected,
    getSelectedText,
  };
}
