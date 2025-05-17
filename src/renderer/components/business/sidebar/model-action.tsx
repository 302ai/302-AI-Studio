import {
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@renderer/components/ui/modal";
import { Button } from "@renderer/components/ui/button";
import { useTranslation } from "react-i18next";
import { MenuModelAction } from "./thread-menu";

interface ModalActionProps {
  state: MenuModelAction | null;
  onOpenChange: () => void;
  actionType: {
    title: string;
    description: string;
    confirmText: string;
    action: () => void;
    body?: React.ReactNode;
    disabled?: boolean;
  };
}

export function ModalAction({
  state,
  onOpenChange,
  actionType,
}: ModalActionProps) {
  const { t } = useTranslation();

  const dangerActions = [MenuModelAction.Delete, MenuModelAction.CleanMessages];

  return (
    <ModalContent isOpen={state !== null} onOpenChange={onOpenChange} isBlurred>
      <ModalHeader>
        <ModalTitle>{actionType.title}</ModalTitle>
        <ModalDescription>{actionType.description}</ModalDescription>
      </ModalHeader>
      {actionType.body && <ModalBody>{actionType.body}</ModalBody>}
      <ModalFooter>
        <ModalClose>{t("thread-menu.actions.cancel")}</ModalClose>
        <Button
          intent={state && dangerActions.includes(state) ? "danger" : "primary"}
          className="min-w-24"
          size="small"
          isDisabled={actionType.disabled}
          onPress={actionType.action}
        >
          {actionType.confirmText}
        </Button>
      </ModalFooter>
    </ModalContent>
  );
}
