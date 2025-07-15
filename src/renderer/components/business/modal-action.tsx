import { Button } from "@renderer/components/ui/button";
import { Modal } from "@renderer/components/ui/modal";
import { useTranslation } from "react-i18next";

interface ModalActionProps {
  state: string | null;
  onOpenChange: () => void;
  actionType: {
    title: string;
    descriptions: string[];
    confirmText?: string;
    action: () => void;
    body?: React.ReactNode;
    disabled?: boolean;
    isPending?: boolean;
  };
  dangerActions?: string[];
}

export function ModalAction({
  state,
  onOpenChange,
  actionType,
  dangerActions,
}: ModalActionProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "thread-menu.actions",
  });

  return (
    <Modal.Content
      isOpen={state !== null}
      onOpenChange={onOpenChange}
      isBlurred
    >
      <Modal.Header>
        <Modal.Title>{actionType.title}</Modal.Title>
        {actionType.descriptions.map((description) => (
          <Modal.Description key={description}>{description}</Modal.Description>
        ))}
      </Modal.Header>
      {actionType.body && <Modal.Body>{actionType.body}</Modal.Body>}
      <Modal.Footer>
        <Modal.Close>{t("cancel")}</Modal.Close>
        <Button
          intent={
            state && dangerActions?.includes(state) ? "danger" : "primary"
          }
          className="min-w-24"
          size="sq-sm"
          isDisabled={actionType.disabled}
          isPending={actionType.isPending}
          onPress={actionType.action}
        >
          {actionType.confirmText ?? t("confirm")}
        </Button>
      </Modal.Footer>
    </Modal.Content>
  );
}
