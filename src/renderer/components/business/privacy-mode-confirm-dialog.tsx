import { Button } from "@renderer/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog";
import { Modal } from "@renderer/components/ui/modal";
import { EventNames, emitter } from "@renderer/services/event-service";
import { Ghost } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogState {
  isOpen: boolean;
  action: string;
  message: string;
}

export function PrivacyModeConfirmDialog() {
  const { t } = useTranslation();
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    action: "",
    message: "",
  });

  const handleConfirm = () => {
    emitter.emit(EventNames.PRIVACY_MODE_CONFIRM, null);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    emitter.emit(EventNames.PRIVACY_MODE_CANCEL, null);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const handleShowDialog = (data: { action: string; message: string }) => {
      setDialogState({
        isOpen: true,
        action: data.action,
        message: data.message,
      });
    };

    const unsubscribe = emitter.on(
      EventNames.PRIVACY_MODE_CONFIRM_DIALOG,
      handleShowDialog,
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Modal>
      <Modal.Content
        isOpen={dialogState.isOpen}
        onOpenChange={() => handleCancel()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ghost className="h-5 w-5 text-purple-600" />
            {t("privacy-mode.confirm-dialog.title")}
          </DialogTitle>
          <DialogDescription className="text-left">
            {dialogState.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button intent="outline" size="sm" onClick={handleCancel}>
            {t("privacy-mode.confirm-dialog.cancel")}
          </Button>
          <Button
            intent="primary"
            size="sm"
            onClick={handleConfirm}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {t("privacy-mode.confirm-dialog.confirm")}
          </Button>
        </DialogFooter>
      </Modal.Content>
    </Modal>
  );
}
