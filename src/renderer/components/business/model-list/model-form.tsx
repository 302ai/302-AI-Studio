import { Checkbox } from "@renderer/components/ui/checkbox";
import { TextField } from "@renderer/components/ui/text-field";
import { Textarea } from "@renderer/components/ui/textarea";
import { useTranslation } from "react-i18next";

export interface ModelFormData {
  name: string;
  description: string;
  capabilities: {
    reasoning: boolean;
    vision: boolean;
    function_call: boolean;
  };
}

interface ModelFormProps {
  data: ModelFormData;
  onChange: (data: ModelFormData) => void;
  validationErrors?: {
    name?: string;
  };
}

export function ModelForm({ data, onChange, validationErrors = {} }: ModelFormProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.add-model-modal",
  });

  const handleNameChange = (name: string) => {
    onChange({ ...data, name });
  };

  const handleDescriptionChange = (description: string) => {
    onChange({ ...data, description });
  };

  const handleCapabilityChange = (capability: keyof typeof data.capabilities) => {
    onChange({
      ...data,
      capabilities: {
        ...data.capabilities,
        [capability]: !data.capabilities[capability],
      },
    });
  };

  return (
    <div className="space-y-4">
      <TextField
        label={t("model-id.label")}
        placeholder={t("model-id.placeholder")}
        description={t("model-id.description")}
        value={data.name}
        onChange={handleNameChange}
        errorMessage={validationErrors.name}
        isRequired
      />

      <Textarea
        label={t("description.label")}
        placeholder={t("description.placeholder")}
        description={t("description.description")}
        value={data.description}
        onChange={handleDescriptionChange}
      />

      <div className="space-y-4">
        <div className="font-medium text-sm">{t("capabilities.label")}</div>
        <div className="flex flex-wrap gap-4">
          <Checkbox
            isSelected={data.capabilities.reasoning}
            onChange={() => handleCapabilityChange("reasoning")}
          >
            {t("capabilities.reasoning")}
          </Checkbox>
          <Checkbox
            isSelected={data.capabilities.vision}
            onChange={() => handleCapabilityChange("vision")}
          >
            {t("capabilities.vision")}
          </Checkbox>
        </div>
      </div>
    </div>
  );
}
