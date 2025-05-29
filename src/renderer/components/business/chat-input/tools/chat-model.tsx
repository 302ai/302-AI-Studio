import { ListBox } from "@renderer/components/ui/list-box";
import { PopoverContent } from "@renderer/components/ui/popover";
import { SearchField } from "@renderer/components/ui/search-field";
import {
  Select,
  SelectOption,
  SelectSection,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { useState } from "react";
import { Autocomplete, useFilter } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { ModelIcon } from "../../model-icon";

export const ChatModel = () => {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });
  const { contains } = useFilter({ sensitivity: "base" });
  const { groupedModels } = useToolBar();
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    // TODO: 处理模型选择逻辑
  };

  return (
    <Select
      aria-label={t("model-select-label")}
      placeholder={t("model-select-placeholder")}
      selectedKey={selectedModelId}
      onSelectionChange={(key) => handleModelSelect(key as string)}
      className="w-fit"
    >
      <SelectTrigger className="rounded-full" />
      <PopoverContent
        showArrow={false}
        respectScreen={false}
        className="min-w-[240px] max-w-[240px] overflow-y-auto overflow-x-hidden"
      >
        <Autocomplete filter={contains}>
          <div className="border-b bg-muted p-2">
            <SearchField
              className="rounded-lg bg-bg"
              placeholder={t("model-search-placeholder")}
              autoFocus
            />
          </div>
          <ListBox
            className="max-h-[250px] min-w-[240px] max-w-[240px] border-0"
            items={groupedModels}
          >
            {(group) => (
              <SelectSection
                title={group.name}
                items={group.models}
                className="w-full"
              >
                {(model) => (
                  <SelectOption
                    key={model.id}
                    id={model.id}
                    textValue={model.name}
                    className="w-full"
                  >
                    <div className="flex w-full flex-row items-center gap-2 overflow-hidden">
                      <ModelIcon
                        modelId={group.id}
                        className="size-4 flex-shrink-0"
                      />
                      <span className="flex-1 overflow-hidden truncate text-ellipsis whitespace-nowrap">
                        {model.name}
                      </span>
                    </div>
                  </SelectOption>
                )}
              </SelectSection>
            )}
          </ListBox>
        </Autocomplete>
      </PopoverContent>
    </Select>
  );
};
