import { triplitClient } from "@renderer/client";
import {
  Select,
  SelectList,
  SelectOption,
  SelectTrigger,
} from "@renderer/components/ui/select";
import type { SearchService } from "@shared/triplit/types";
import { useQueryOne } from "@triplit/react";
import { Search } from "lucide-react";
import type { Key } from "react-aria-components";
import { useTranslation } from "react-i18next";

const { configService } = window.service;

const searchServices = [
  { key: "search1api", label: "search1api" },
  { key: "tavily", label: "tavily" },
  { key: "exa", label: "exa" },
  { key: "bochaai", label: "bochaai" },
];

export function SearchProvider() {
  const { t } = useTranslation();

  const settingsQuery = triplitClient.query("settings");
  const { result: settingsResult } = useQueryOne(triplitClient, settingsQuery);
  const currentsearchService = settingsResult?.searchService ?? "search1api";

  const handlesearchServiceChange = async (key: Key | null) => {
    await configService.setSearchService(key as SearchService);
  };

  return (
    <div className="flex flex-col gap-2">
      <div>{t("settings.general-settings.search-provider.label")}</div>
      <Select
        className="w-[240px]"
        selectedKey={currentsearchService}
        onSelectionChange={handlesearchServiceChange}
        aria-label="Select search provider"
      >
        <SelectTrigger
          className="h-9 cursor-pointer rounded-xl text-secondary-fg"
          prefix={<Search className="mr-1 size-4" />}
        />
        <SelectList popoverClassName="min-w-[240px]" items={searchServices}>
          {(provider) => (
            <SelectOption
              className="flex cursor-pointer justify-between"
              key={provider.key}
              id={provider.key}
              textValue={provider.label}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{provider.label}</span>
              </span>
            </SelectOption>
          )}
        </SelectList>
      </Select>
    </div>
  );
}
