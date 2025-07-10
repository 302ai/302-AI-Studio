import { Button } from "@renderer/components/ui/button";
import { Checkbox } from "@renderer/components/ui/checkbox";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@renderer/components/ui/modal";

import { TextField } from "@renderer/components/ui/text-field";
import { Textarea } from "@renderer/components/ui/textarea";
import logger from "@shared/logger/renderer-logger";
import type { Model, UpdateModelData } from "@shared/triplit/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

  const [modelName, setModelName] = useState("");
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [capabilities, setCapabilities] = useState({
    reasoning: false,
    vision: false,
    function_call: false,
  });

  const handleCapabilityChange = (capability: keyof typeof capabilities) => {
    setCapabilities((prev) => ({
      ...prev,
      [capability]: !prev[capability],
    }));
  };

  const [validationErrors, setValidationErrors] = useState<{
    modelName?: string;
  }>({});

  useEffect(() => {
    if (model && isOpen) {
      setModelName(model.name);
      setRemark(model.remark || "");

      const modelCapabilities = Array.from(model.capabilities || []);
      setCapabilities({
        reasoning: modelCapabilities.includes("reasoning"),
        vision: modelCapabilities.includes("vision"),
        function_call: modelCapabilities.includes("function_call"),
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
      const capabilityArray = Object.entries(capabilities)
        .filter(([_, enabled]) => enabled)
        .map(([capability]) => capability);

      const updateData: UpdateModelData = {
        name: modelName.trim(),
        capabilities: new Set(capabilityArray),
        remark: remark.trim(),
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
    setModelName("");
    setRemark("");
    setCapabilities({
      reasoning: false,
      vision: false,
      function_call: false,
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
        <ModalBody className="space-y-4 px-6 py-4">
          <TextField
            label={t("model-id.label")}
            placeholder={t("model-id.placeholder")}
            description={t("model-id.description")}
            value={modelName}
            onChange={setModelName}
            errorMessage={validationErrors.modelName}
            isRequired
          />

          <Textarea
            label={t("description.label")}
            placeholder={t("description.placeholder")}
            description={t("description.description")}
            value={remark}
            onChange={setRemark}
          />

          <div className="space-y-4">
            <div className="font-medium text-sm">{t("capabilities.label")}</div>
            <div className="flex flex-wrap gap-4">
              <Checkbox
                isSelected={capabilities.reasoning}
                onChange={() => handleCapabilityChange("reasoning")}
              >
                {t("capabilities.reasoning")}
              </Checkbox>
              <Checkbox
                isSelected={capabilities.vision}
                onChange={() => handleCapabilityChange("vision")}
              >
                {t("capabilities.vision")}
              </Checkbox>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalClose>{t("actions.cancel")}</ModalClose>
          <Button
            intent="primary"
            onPress={handleSubmit}
            isDisabled={!modelName.trim() || !model || isSubmitting}
            isPending={isSubmitting}
          >
            {t("actions.save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
