import { Button } from "@renderer/components/ui/button";
import {
  Select,
  SelectList,
  SelectOption,
  SelectSection,
  SelectTrigger,
} from "@renderer/components/ui/select";
import { Separator } from "@renderer/components/ui/separator";
import { useToolBar } from "@renderer/hooks/use-tool-bar";
import { cn } from "@renderer/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCircleArrowUp } from "react-icons/fa6";
import { ModelIcon } from "../model-icon";
import { AttachmentUploader } from "./tools/attachment-uploader";

interface ToolBarProps {
  className?: string;
}

export function ToolBar({ className }: ToolBarProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });
  const { groupedModels, handleSendMessage } = useToolBar();
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    // TODO: 处理模型选择逻辑
  };

  return (
    <div
      className={cn(
        "flex h-[var(--chat-input-toolbar-height)] flex-row items-center justify-between",
        className
      )}
    >
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-row items-center gap-x-2">
          <AttachmentUploader />
        </div>

        <div className="flex flex-row items-center gap-x-2">
          <Select
            aria-label={t("model-select-label")}
            placeholder={t("model-select-placeholder")}
            selectedKey={selectedModelId}
            onSelectionChange={(key) => handleModelSelect(key as string)}
            className="w-[240px]"
          >
            <SelectTrigger className="cursor-pointer border-none shadow-none ring-0" />
            <SelectList
              popoverClassName="min-w-[240px] max-w-[240px] h-[300px] overflow-y-auto overflow-x-hidden"
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
            </SelectList>
          </Select>

          <Separator className="h-1/2 w-[2px]" orientation="vertical" />

          <Button
            intent="plain"
            size="square-petite"
            shape="circle"
            onClick={handleSendMessage}
          >
            <FaCircleArrowUp className="size-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
