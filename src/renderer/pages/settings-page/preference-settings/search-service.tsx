import { triplitClient } from "@renderer/client";
import { Label } from "@renderer/components/ui/field";
import { Select } from "@renderer/components/ui/select";
import { cn } from "@renderer/lib/utils";
import type { SearchServices } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";

const { configService } = window.service;

const searchServices = [
  { key: "search1api", label: "search1api" },
  { key: "tavily", label: "tavily" },
  { key: "exa", label: "exa" },
  { key: "bochaai", label: "bochaai" },
];

export function SearchService() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.preference-settings",
  });

  const settingsQuery = triplitClient.query("settings");
  const { result: settingsResult } = useQueryOne(triplitClient, settingsQuery);
  const currentsearchService = settingsResult?.searchService ?? "search1api";

  const handleSearchServiceChange = async (key: Key | null) => {
    await configService.setSearchService(key as SearchServices);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-label-fg">{t("search-provider.label")}</Label>
      <Select
        className="min-w-[398px]"
        selectedKey={currentsearchService}
        onSelectionChange={handleSearchServiceChange}
        aria-label="Select search provider"
      >
        <Select.Trigger className="inset-ring-transparent h-11 rounded-[10px] bg-setting text-setting-fg transition-none hover:inset-ring-transparent" />
        <Select.List
          popover={{ className: "min-w-[398px]" }}
          items={searchServices}
        >
          {({ key, label }) => (
            <Select.Option
              className={cn(
                "flex cursor-pointer justify-between",
                "[&>[data-slot='check-indicator']]:order-last [&>[data-slot='check-indicator']]:mr-0 [&>[data-slot='check-indicator']]:ml-auto",
              )}
              key={key}
              id={key}
              textValue={label}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{label}</span>
              </span>
            </Select.Option>
          )}
        </Select.List>
      </Select>
    </div>
  );
}
