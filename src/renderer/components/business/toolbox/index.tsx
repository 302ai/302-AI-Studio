import { buttonStyles } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/field";
import { SearchField } from "@renderer/components/ui/search-field";
import { Sheet } from "@renderer/components/ui/sheet";
import { useTriplit } from "@renderer/hooks/use-triplit";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LdrsLoader } from "../ldrs-loader";
import { ToolCard } from "./tool-card";

export function Toolbox() {
  const { t } = useTranslation("translation", {
    keyPrefix: "new-thread",
  });

  const { toolbox, toolboxFetching } = useTriplit();

  return (
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
        <Sheet.Header className="flex flex-col gap-y-2 px-4 py-3">
          <Label>{t("toolbox-label")}</Label>
          <SearchField
            aria-label="Search"
            placeholder={t("toolbox-search-placeholder")}
          />
        </Sheet.Header>
        <Sheet.Body className="flex flex-col gap-y-2 py-3 pr-2 pl-4">
          {toolboxFetching ? (
            <div className="flex h-full items-center justify-center">
              <LdrsLoader type="waveform" size={24} />
            </div>
          ) : (
            <div className="flex flex-col gap-y-2">
              {toolbox?.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </Sheet.Body>
        <Sheet.Footer className="py-1.5" />
      </Sheet.Content>
    </Sheet>
  );
}
