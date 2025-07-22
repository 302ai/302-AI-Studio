import { Checkbox } from "@renderer/components/ui/checkbox";
import { Label } from "@renderer/components/ui/field";
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

export function ModelForm({ data, onChange }: ModelFormProps) {
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
      <div className="flex flex-col gap-y-2">
        <Label className="text-[#555555] dark:text-[#999999]">
          {t("model-id.label")}
        </Label>
        <TextField
          // label={t("model-id.label")}
          placeholder={t("model-id.placeholder")}
          // description={t("model-id.description")}
          value={data.name}
          onChange={handleNameChange}
          // className="[&_[role=group]]:inset-ring-transparent [&_[role=group]]:h-11 [&_[role=group]]:bg-setting [&_[role=group]]:shadow-none [&_[role=group]]:focus-within:inset-ring-transparent [&_[role=group]]:hover:inset-ring-transparent [&_input]:text-setting-fg"
          className="rounded-[10px] bg-setting [&_[role=group]]:h-11"
        />
        <span className="max-w-full overflow-hidden whitespace-normal break-all text-[#AAAAAA] text-xs dark:text-[#555555]">
          {t("model-id.description")}
        </span>
      </div>

      <div className="flex flex-col gap-y-2">
        <Label className="text-[#555555] dark:text-[#999999]">
          {t("description.label")}
        </Label>
        <TextField
          placeholder={t("description.placeholder")}
          value={data.description}
          onChange={handleDescriptionChange}
          className="rounded-[10px] bg-setting [&_[role=group]]:h-11"
        />
        <span className="max-w-full overflow-hidden whitespace-normal break-all text-[#AAAAAA] text-xs dark:text-[#555555]">
          {t("description.description")}
        </span>
      </div>

      <div className="flex flex-col gap-y-2">
        <Label className="text-[#555555] dark:text-[#999999]">
          {t("type.label")}
        </Label>
        <RadioGroup
          value={data.type}
          onChange={(value) => handleTypeChange(value as ModelType)}
        >
          <div className="flex flex-wrap gap-4">
            <Radio value="language">{t("type.language")}</Radio>
            <Radio value="image-generation">{t("type.image-generation")}</Radio>
            <Radio value="tts">{t("type.tts")}</Radio>
            <Radio value="embedding">{t("type.embedding")}</Radio>
            <Radio value="rerank">{t("type.rerank")}</Radio>
          </div>
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-y-2">
        <Label className="text-[#555555] dark:text-[#999999]">
          {t("capabilities.label")}
        </Label>
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
