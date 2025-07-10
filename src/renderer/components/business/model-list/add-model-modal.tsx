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
import { useActiveProvider } from "@renderer/hooks/use-active-provider";
import logger from "@shared/logger/renderer-logger";
import type { CreateModelData } from "@shared/triplit/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

  const [modelId, setModelId] = useState("");
  const [description, setDescription] = useState("");
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
    modelId?: string;
  }>({});

  const handleSubmit = async () => {
    if (!selectedProvider) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Build capabilities array
      const capabilityArray = Object.entries(capabilities)
        .filter(([_, enabled]) => enabled)
        .map(([capability]) => capability);

      const newModel: CreateModelData = {
        name: modelId.trim(),
        providerId: selectedProvider.id,
        capabilities: new Set(capabilityArray),
        custom: true,
        enabled: true,
        collected: false,
        remark: description.trim(),
      };

      // await triplitClient.insert("models", newModel);
      await modelService.insertModel(selectedProvider.id, newModel);
      toast.success(t("actions.add-success"));

      resetForm();
      onOpenChange(false);
      onModelAdded?.();
    } catch (error) {
      console.log("errorerrorerrorerror", error);

      logger.error("Failed to add model", { error });
      toast.error(t("actions.add-error-message"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setModelId("");
    setDescription("");
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
          <ModalTitle>{t("title")}</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4 px-6 py-4">
          <TextField
            label={t("model-id.label")}
            placeholder={t("model-id.placeholder")}
            description={t("model-id.description")}
            value={modelId}
            onChange={setModelId}
            errorMessage={validationErrors.modelId}
            isRequired
          />

          <Textarea
            label={t("description.label")}
            placeholder={t("description.placeholder")}
            description={t("description.description")}
            value={description}
            onChange={setDescription}
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

          {/* <div className="space-y-4">
            <div className="font-medium text-sm">模型上下文</div>
            <Select
              placeholder="请选择"
              selectedKey={contextLength}
              onSelectionChange={(key) => setContextLength(key as string)}
            >
              <SelectTrigger />
              <SelectList>
                <SelectOption id="8k">8k</SelectOption>
                <SelectOption id="16k">16k</SelectOption>
                <SelectOption id="32k">32k</SelectOption>
                <SelectOption id="64k">64k</SelectOption>
                <SelectOption id="128k">128k</SelectOption>
              </SelectList>
            </Select>
          </div> */}
        </ModalBody>
        <ModalFooter>
          <ModalClose>{t("actions.cancel")}</ModalClose>
          <Button
            intent="primary"
            onPress={handleSubmit}
            isDisabled={!modelId.trim() || !selectedProvider || isSubmitting}
            isPending={isSubmitting}
          >
            {t("actions.save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
