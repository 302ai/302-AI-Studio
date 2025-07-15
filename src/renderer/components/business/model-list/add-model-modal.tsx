import { Button } from "@renderer/components/ui/button";
import { Modal } from "@renderer/components/ui/modal";

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
      <Modal.Content isOpen={isOpen} onOpenChange={handleOpenChange} size="lg">
        <Modal.Header>
          <Modal.Title>{t("title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-6 py-4">
          <ModelForm
            data={formData}
            onChange={setFormData}
            validationErrors={validationErrors}
          />
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>{t("actions.cancel")}</Modal.Close>
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
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
