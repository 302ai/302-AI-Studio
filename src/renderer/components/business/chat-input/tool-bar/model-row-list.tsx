/** biome-ignore-all lint/a11y/useSemanticElements: ignore useSemanticElements */
import SelectedIcon from "@renderer/assets/icons/selected.svg";
import { ModelIcon } from "@renderer/components/business/model-icon";
import {
  Disclosure,
  DisclosureTrigger,
} from "@renderer/components/ui/disclosure";
import { Tooltip } from "@renderer/components/ui/tooltip";
import { useTheme } from "@renderer/context/theme-provider";
import { cn } from "@renderer/lib/utils";
import type { Model } from "@shared/triplit/types";
import { Star } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { areEqual } from "react-window";

const { modelService } = window.service;
export interface ListItem {
  type: "group" | "model";
  id: string;
  name: string;
  providerId: string;
  model: Model;
  remark: string;
  isExpanded?: boolean;
  models?: Model[];
}

export const ModelRowList = memo(function ModelRowList({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    items: ListItem[];
    onSelect: (modelId: string) => void;
    selectedModelId: string;
    onToggleGroup?: (groupId: string) => void;
    expandedGroups?: Set<string>;
    hasSearch?: boolean;
  };
}) {
  const {
    items,
    onSelect,
    selectedModelId,
    onToggleGroup,
    expandedGroups,
    hasSearch,
  } = data;
  const item = items[index];
  const { t } = useTranslation("translation", {
    keyPrefix: "chat",
  });
  const { theme, isSystemDark } = useTheme();

  if (item.type === "group") {
    const isExpanded = hasSearch
      ? !expandedGroups?.has(`collapsed-${item.id}`)
      : (expandedGroups?.has(item.id) ?? false);

    return (
      <div style={style} className="mb-1">
        <Disclosure
          isExpanded={isExpanded}
          className="!border-b-transparent"
          // defaultExpanded={true}
        >
          <DisclosureTrigger
            className="flex h-12 w-full items-center rounded-md border-b-none px-2 py-1 font-medium text-xs "
            onPress={() => onToggleGroup?.(item.id)}
          >
            <span className="text-[#000000] dark:text-[#E6E6E6]">
              {item.name}
            </span>
          </DisclosureTrigger>
        </Disclosure>
      </div>
    );
  }

  const isSelected = selectedModelId === item.model.id;

  const handleUpdateModel = async () => {
    await modelService.collectModel(item.model.id, !item.model.collected);
  };

  const hasCapabilities = Array.from(item.model.capabilities).some(
    (capability) => capability,
  );

  const isDarkMode = theme === "dark" || (theme === "system" && isSystemDark);

  const starColor = item.model.collected
    ? "#FFB143"
    : isDarkMode
      ? isSelected
        ? "#1A1A1A"
        : "#5C5C5C"
      : "#E7E7E7";

  return (
    <Tooltip>
      <div style={style} className="mb-1">
        <Tooltip.Trigger className="w-full">
          <div
            className={cn(
              "relative flex h-12 cursor-pointer items-center rounded-md pr-[12px] pl-[14px] text-sm outline-hidden hover:bg-hover-primary ",
              "dark:text-[#E6E6E6] dark:hover:bg-[#1A1A1A]",
              isSelected &&
                "bg-[#F3F2FF] text-[#8E47F0] hover:bg-[#F3F2FF] dark:bg-[#49306A] dark:text-[#FFFFFF] dark:hover:bg-[#49306A]",
            )}
            onClick={() => onSelect(item.model.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelect(item.model.id);
              }
            }}
            role="option"
            tabIndex={-1}
            aria-selected={isSelected}
          >
            {isSelected && (
              <img
                src={SelectedIcon}
                alt="selected"
                className="absolute top-0 right-0 size-6"
              />
            )}
            <div className="flex w-full flex-row items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center gap-x-4">
                <ModelIcon
                  modelName={item.model.name}
                  className="size-5 flex-shrink-0"
                />
                <span className="flex-1 overflow-hidden truncate text-ellipsis whitespace-nowrap ">
                  {item.model.remark || item.model.name}
                </span>
              </div>

              <Star
                className={cn(
                  "mr-2 size-4 flex-shrink-0 ",
                  item.model.collected && " ",
                )}
                fill={starColor}
                color={starColor}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateModel();
                }}
              />
            </div>
            {hasCapabilities && (
              <Tooltip.Content
                // className={cn(
                //   "border-none bg-[#F3F2FF] text-[#8E47F0] [&_[data-slot=overlay-arrow]]:fill-[#F3F2FF]",
                //   "dark:bg-[#1A1A1A] dark:text-[#8E47F0] [&_[data-slot=overlay-arrow]]:dark:fill-[#1A1A1A]",
                // )}
                showArrow={false}
                intent="inverse"
              >
                <div>
                  <span>{t("support")}</span>
                  {Array.from(item.model.capabilities).map(
                    (capability, index, array) => (
                      <span key={capability}>
                        {t(`${capability}`)}
                        {index < array.length - 1 ? "、" : ""}
                      </span>
                    ),
                  )}
                </div>
              </Tooltip.Content>
            )}
          </div>
        </Tooltip.Trigger>
      </div>
    </Tooltip>
  );
}, areEqual);
