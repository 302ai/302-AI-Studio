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

import logger from "@shared/logger/renderer-logger";
import type { Model, UpdateModelData } from "@shared/triplit/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ModelForm, type ModelFormData } from "./model-form";

interface EditModelModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  model: Model | null;
  onModelUpdated?: () => void;
}

const { modelService } = window.service;

export function EditModelModal({
  isOpen,
  onOpenChange,
  model,
}: EditModelModalProps) {
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

  useEffect(() => {
    if (model && isOpen) {
      const modelCapabilities = Array.from(model.capabilities || []);
      setFormData({
        name: model.name,
        description: model.remark || "",
        capabilities: {
          reasoning: modelCapabilities.includes("reasoning"),
          vision: modelCapabilities.includes("vision"),
          function_call: modelCapabilities.includes("function_call"),
        },
      });

      setValidationErrors({});
    }
  }, [model, isOpen]);

  const handleSubmit = async () => {
    if (!model) {
      return;
    }

    setIsSubmitting(true);
    try {
      const capabilityArray = Object.entries(formData.capabilities)
        .filter(([_, enabled]) => enabled)
        .map(([capability]) => capability);

      const updateData: UpdateModelData = {
        name: formData.name.trim(),
        capabilities: new Set(capabilityArray),
        remark: formData.description.trim(),
      };

      // await triplitClient.update("models", model.id, updateData);
      await modelService.updateModel(model.id, updateData);

      toast.success(t("actions.edit-success"));
      setTimeout(() => {
        onOpenChange(false);
      }, 50);
      // onModelUpdated?.();
    } catch (error) {
      logger.error("Failed to update model", { error });
      toast.error(t("actions.edit-error-message"));
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
          <ModalTitle>{t("edit-title")}</ModalTitle>
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
            isDisabled={!formData.name.trim() || !model || isSubmitting}
            isPending={isSubmitting}
          >
            {t("actions.save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
