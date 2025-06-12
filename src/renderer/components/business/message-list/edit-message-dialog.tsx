import { Button } from "@renderer/components/ui/button";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@renderer/components/ui/modal";
import { Textarea } from "@renderer/components/ui/textarea";
import type { Message } from "@shared/triplit/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface EditMessageDialogProps {
  message: Message;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const { messageService } = window.service;

export function EditMessageDialog({
  message,
  isOpen,
  onOpenChange,
}: EditMessageDialogProps) {
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation("translation", {
    keyPrefix: "message",
  });

  const handleSaveEdit = async () => {
    if (editContent.trim() === message.content.trim()) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      await messageService.updateMessage(message.id, {
        content: editContent.trim(),
      });
      onOpenChange(false);
      toast.success(
        t("edit-dialog.save-success") || "Message updated successfully",
      );
    } catch (error) {
      console.error("Failed to update message:", error);
      toast.error(t("edit-dialog.save-error") || "Failed to update message");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    onOpenChange(false);
  };

  // Reset content when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setEditContent(message.content);
    }
    onOpenChange(open);
  };

  return (
    <Modal>
      <ModalContent
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        size="lg"
      >
        <ModalHeader>
          <ModalTitle>{t("edit-dialog.title")}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Textarea
            value={editContent}
            onChange={setEditContent}
            placeholder={message.content}
            className="min-h-32"
            resize="vertical"
          />
        </ModalBody>
        <ModalFooter>
          <ModalClose onPress={handleCancelEdit}>
            {t("edit-dialog.cancel")}
          </ModalClose>
          <Button
            intent="primary"
            onPress={handleSaveEdit}
            isDisabled={isSaving || editContent.trim() === message.content.trim()}
            isPending={isSaving}
          >
            {t("edit-dialog.save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
