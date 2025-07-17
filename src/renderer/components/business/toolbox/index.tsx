// import { triplitClient } from "@renderer/client";
import { buttonStyles } from "@renderer/components/ui/button";
import { Label } from "@renderer/components/ui/field";
import { Sheet } from "@renderer/components/ui/sheet";
// import { useQuery } from "@triplit/react";
import { LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Toolbox() {
  const { t } = useTranslation("translation", {
    keyPrefix: "new-thread",
  });

  // const toolboxQuery = triplitClient.query("toolbox");
  // const { result } = useQuery(triplitClient, toolboxQuery);

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
        <Sheet.Body className="px-4 py-3">
          <Label>{t("toolbox-label")}</Label>
        </Sheet.Body>
      </Sheet.Content>
    </Sheet>
  );
}
