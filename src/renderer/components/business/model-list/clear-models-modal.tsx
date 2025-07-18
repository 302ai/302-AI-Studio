import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ModalAction } from "../modal-action";

interface ClearModelsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  providerId?: string;
}

export function ClearModelsModal({
  isOpen,
  onOpenChange,
  providerId,
}: ClearModelsModalProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.add-model-modal",
  });
  const [isClearing, setIsClearing] = useState(false);
  const { modelService } = window.service;

  const handleConfirmClear = async () => {
    if (!providerId || isClearing) return;

    setIsClearing(true);
    try {
      await modelService.clearModel(providerId);
      toast.success(t("actions.clear-success-message"));
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to clear models", error);
      toast.error(t("actions.clear-error-message"));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <ModalAction
      state={isOpen ? "clear" : null}
      onOpenChange={() => onOpenChange(false)}
      actionType={{
        title: t("actions.clear-title"),
        descriptions: [t("actions.clear-description")],
        confirmText: t("actions.clear-confirm-text"),
        disabled: isClearing,
        isPending: isClearing,
        action: handleConfirmClear,
      }}
      dangerActions={["clear"]}
    />
  );
}
