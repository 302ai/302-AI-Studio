import {
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@renderer/components/ui/modal";
import { Button } from "@renderer/components/ui/button";
import { useTranslation } from "react-i18next";

interface ModalActionProps {
  state: string | null;
  onOpenChange: () => void;
  actionType: {
    description: string;
    action: () => void;
    confirmText: string;
    title: string;
  };
  disabled?: boolean;
}

export function ModalAction({
  state,
  onOpenChange,
  actionType,
  disabled,
}: ModalActionProps) {
  const { t } = useTranslation();

  return (
    <ModalContent isOpen={state !== null} onOpenChange={onOpenChange}>
      <ModalHeader>
        <ModalTitle>{actionType?.title}</ModalTitle>
        <ModalDescription>{actionType?.description}</ModalDescription>
      </ModalHeader>
      <ModalFooter>
        <ModalClose>{t("thread-menu.actions.cancel")}</ModalClose>
        <Button
          intent={state === "ban" ? "danger" : "primary"}
          className="min-w-24"
          isDisabled={disabled}
          onPress={actionType?.action}
        >
          {actionType.confirmText}
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
