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

import { useActiveProvider } from "@renderer/hooks/use-active-provider";
import logger from "@shared/logger/renderer-logger";
import type { CreateModelData } from "@shared/triplit/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ModelForm, type ModelFormData } from "./model-form";

const { modelService } = window.service;

interface AddModelModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onModelAdded?: () => void;
}

export function AddModelModal({
  isOpen,
  onOpenChange,
  onModelAdded,
}: AddModelModalProps) {
  const { selectedProvider } = useActiveProvider();
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.add-model-modal",
  });

  const [formData, setFormData] = useState<ModelFormData>({
    name: "",
    description: "",
    capabilities: {
      reasoning: false,
      vision: false,
      function_call: false,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
  }>({});

  const handleSubmit = async () => {
    if (!selectedProvider) {
      return;
    }

    setIsSubmitting(true);
    try {
      const capabilityArray = Object.entries(formData.capabilities)
        .filter(([_, enabled]) => enabled)
        .map(([capability]) => capability);

      const newModel: CreateModelData = {
        name: formData.name.trim(),
        providerId: selectedProvider.id,
        capabilities: new Set(capabilityArray),
        custom: true,
        enabled: true,
        collected: false,
        remark: formData.description.trim(),
      };

      await modelService.insertModel(selectedProvider.id, newModel);
      toast.success(t("actions.add-success"));

      resetForm();
      onOpenChange(false);
      onModelAdded?.();
    } catch (error) {
      logger.error("Failed to add model", { error });
      toast.error(t("actions.add-error-message"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      capabilities: {
        reasoning: false,
        vision: false,
        function_call: false,
      },
    });
    setValidationErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Modal>
      <ModalContent isOpen={isOpen} onOpenChange={handleOpenChange} size="lg">
        <ModalHeader>
          <ModalTitle>{t("title")}</ModalTitle>
        </ModalHeader>
        <ModalBody className="px-6 py-4">
          <ModelForm
            data={formData}
            onChange={setFormData}
            validationErrors={validationErrors}
          />
        </ModalBody>
        <ModalFooter>
          <ModalClose>{t("actions.cancel")}</ModalClose>
          <Button
            intent="primary"
            onPress={handleSubmit}
            isDisabled={
              !formData.name.trim() || !selectedProvider || isSubmitting
            }
            isPending={isSubmitting}
          >
            {t("actions.save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
