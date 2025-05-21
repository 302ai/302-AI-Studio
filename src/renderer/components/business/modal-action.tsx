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

interface ModalActionProps {
  state: string | null;
  onOpenChange: () => void;
  actionType: {
    title: string;
    descriptions: string[];
    confirmText: string;
    action: () => void;
    body?: React.ReactNode;
    disabled?: boolean;
  };
  dangerActions?: string[];
}

export function ModalAction({
  state,
  onOpenChange,
  actionType,
  dangerActions,
}: ModalActionProps) {
  const { t } = useTranslation();

  return (
    <ModalContent isOpen={state !== null} onOpenChange={onOpenChange} isBlurred>
      <ModalHeader>
        <ModalTitle>{actionType.title}</ModalTitle>
        {actionType.descriptions.map((description) => (
          <ModalDescription key={description}>{description}</ModalDescription>
        ))}
      </ModalHeader>
      {actionType.body && <ModalBody>{actionType.body}</ModalBody>}
      <ModalFooter>
        <ModalClose>{t("thread-menu.actions.cancel")}</ModalClose>
        <Button
          intent={
            state && dangerActions?.includes(state) ? "danger" : "primary"
          }
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
