import { Button } from "@renderer/components/ui/button";
import { Modal } from "@renderer/components/ui/modal";
import { Textarea } from "@renderer/components/ui/textarea";
import logger from "@shared/logger/renderer-logger";
import type { Message } from "@shared/triplit/types";
import { useEffect, useState } from "react";
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

  // Sync editContent when message changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setEditContent(message.content || "");
    }
  }, [message.content, isOpen]);

  const handleSaveEdit = async () => {
    if (editContent.trim() === message.content.trim()) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      await messageService.editMessage(message.id, {
        content: editContent.trim(),
        threadId: message.threadId,
      });
      onOpenChange(false);
      toast.success(
        t("edit-dialog.save-success") || "Message updated successfully",
      );
    } catch (error) {
      logger.error("Failed to update message", { error });
      toast.error(t("edit-dialog.save-error") || "Failed to update message");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content || "");
    onOpenChange(false);
  };

  return (
    <Modal.Content
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      aria-label="Edit message dialog"
    >
      <Modal.Header>
        <Modal.Title>{t("edit-dialog.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Textarea
          value={editContent}
          onChange={setEditContent}
          placeholder={message.content}
          className="min-h-32"
          aria-label="Edit message content"
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Close onPress={handleCancelEdit}>
          {t("edit-dialog.cancel")}
        </Modal.Close>
        <Button
          intent="primary"
          onPress={handleSaveEdit}
          isDisabled={isSaving || editContent.trim() === message.content.trim()}
          isPending={isSaving}
        >
          {t("edit-dialog.save")}
        </Button>
      </Modal.Footer>
    </Modal.Content>
  );
}
