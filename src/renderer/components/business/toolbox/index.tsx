import { buttonStyles } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/field";
import { SearchField } from "@renderer/components/ui/search-field";
import { Sheet } from "@renderer/components/ui/sheet";
import { useToolbox } from "@renderer/hooks/use-toolbox";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LdrsLoader } from "../ldrs-loader";
import { FontDisplayToolCard } from "./font-display-tool-card";
import { ToolCategoryList } from "./tool-category-list";
import { ToolSearchList } from "./tool-search-list";

export function Toolbox() {
  const { t } = useTranslation("translation", {
    keyPrefix: "new-thread",
  });

  const {
    fontDisplayTools,
    categorizedTools,
    setSearchQuery,
    searchQuery,
    toolboxFetching,
  } = useToolbox();

  return (
    <div className="flex w-full flex-1 flex-row flex-wrap items-center gap-x-3.5 gap-y-4">
      {fontDisplayTools.map((tool) => (
        <FontDisplayToolCard
          key={tool.id}
          tool={tool}
          className={buttonStyles({
            intent: "outline",
            className: "h-[46px]",
          })}
        />
      ))}
      <Sheet>
        <Sheet.Trigger
          className={buttonStyles({
            size: "md",
            intent: "outline",
            className: "h-[46px]",
          })}
        >
          <LayoutGrid className="h-5 w-5" />
          <span>{t("toolbox-button")}</span>
        </Sheet.Trigger>
        <Sheet.Content
          isFloat={false}
          className="!max-w-[260px] top-[calc(var(--title-bar-height)+1px)] h-[calc(100vh-var(--title-bar-height)-1px)] border-none"
          side="right"
        >
          <Sheet.Header className="flex flex-col gap-y-1 px-4 pt-3 pb-[10px]">
            <Label className="mb-0">{t("toolbox-label")}</Label>
            <SearchField
              className="h-10 rounded-[10px] bg-bg"
              aria-label="Search"
              placeholder={t("toolbox-search-placeholder")}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </Sheet.Header>
          <Sheet.Body className="flex flex-col gap-y-2 py-0 pr-2 pl-4">
            {toolboxFetching ? (
              <div className="flex h-full items-center justify-center">
                <LdrsLoader type="waveform" size={24} />
              </div>
            ) : searchQuery.trim() ? (
              <ToolSearchList categorizedTools={categorizedTools} />
            ) : (
              <ToolCategoryList categorizedTools={categorizedTools} />
            )}
          </Sheet.Body>
          <Sheet.Footer className="py-1.5" />
        </Sheet.Content>
      </Sheet>
    </div>
  );
}
