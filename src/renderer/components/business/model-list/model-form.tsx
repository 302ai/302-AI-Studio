import { Checkbox } from "@renderer/components/ui/checkbox";
import { Radio, RadioGroup } from "@renderer/components/ui/radio-group";
import { TextField } from "@renderer/components/ui/text-field";
import { useTranslation } from "react-i18next";

export type ModelType =
  | "language"
  | "image-generation"
  | "tts"
  | "embedding"
  | "rerank";

export interface ModelFormData {
  name: string;
  description: string;
  type: ModelType;
  capabilities: {
    reasoning: boolean;
    vision: boolean;
    function_call: boolean;
    music: boolean;
    video: boolean;
  };
}

interface ModelFormProps {
  data: ModelFormData;
  onChange: (data: ModelFormData) => void;
  validationErrors?: {
    name?: string;
  };
}

export function ModelForm({
  data,
  onChange,
  validationErrors = {},
}: ModelFormProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.add-model-modal",
  });

  const handleNameChange = (name: string) => {
    onChange({ ...data, name });
  };

  const handleDescriptionChange = (description: string) => {
    onChange({ ...data, description });
  };

  const handleTypeChange = (type: ModelType) => {
    onChange({ ...data, type });
  };

  const handleCapabilityChange = (
    capability: keyof typeof data.capabilities,
  ) => {
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

      <TextField
        label={t("description.label")}
        placeholder={t("description.placeholder")}
        description={t("description.description")}
        value={data.description}
        onChange={handleDescriptionChange}
      />

      <RadioGroup
        label={t("type.label")}
        // description={t("type.description")}
        value={data.type}
        onChange={(value) => handleTypeChange(value as ModelType)}
        className="space-y-3"
      >
        <div className="flex flex-wrap gap-4">
          <Radio value="language">{t("type.language")}</Radio>
          <Radio value="image-generation">{t("type.image-generation")}</Radio>
          <Radio value="tts">{t("type.tts")}</Radio>
          <Radio value="embedding">{t("type.embedding")}</Radio>
          <Radio value="rerank">{t("type.rerank")}</Radio>
        </div>
      </RadioGroup>

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
          <Checkbox
            isSelected={data.capabilities.music}
            onChange={() => handleCapabilityChange("music")}
          >
            {t("capabilities.music")}
          </Checkbox>
          <Checkbox
            isSelected={data.capabilities.video}
            onChange={() => handleCapabilityChange("video")}
          >
            {t("capabilities.video")}
          </Checkbox>
          <Checkbox
            isSelected={data.capabilities.function_call}
            onChange={() => handleCapabilityChange("function_call")}
          >
            {t("capabilities.function_call")}
          </Checkbox>
        </div>
      </div>
    </div>
  );
}
