import { Button } from "@renderer/components/ui/button";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchButtonProps {
  onClick: () => void;
}

export function SearchButton({ onClick }: SearchButtonProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "sidebar.search-thread",
  });

  return (
    <Button
      intent="plain"
      className="flex h-[40px] w-full items-center justify-start bg-bg pressed:bg-hover text-muted-fg hover:bg-bg hover:text-sidebar-fg"
      onClick={onClick}
    >
      <Search className="h-4 w-4" />
      <span className="text-sm">{t("placeholder")}</span>
    </Button>
  );
}
