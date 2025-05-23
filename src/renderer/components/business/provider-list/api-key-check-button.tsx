import { Button } from "@renderer/components/ui/button";
import { TailChase } from "ldrs/react";
import { useTranslation } from "react-i18next";
import { IoKeyOutline } from "react-icons/io5";
import { LoaderRenderer } from "../loader-renderer";

type CheckStatus = "idle" | "loading";

interface ApiKeyCheckButtonProps {
  status: CheckStatus;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ApiKeyCheckButton({
  status,
  isDisabled = false,
  onClick,
  className,
}: ApiKeyCheckButtonProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.add-provider-form",
  });

  const buttonStatuses = {
    idle: {
      icon: <IoKeyOutline className="size-4" />,
      text: t("check-key"),
    },
    loading: {
      icon: <TailChase size="16" color="currentColor" />,
      text: t("checking"),
    },
  } as const;

  return (
    <Button
      intent="outline"
      className={`self-end transition-all duration-300 ${className || ""}`}
      onClick={onClick}
      isDisabled={isDisabled}
      isPending={status === "loading"}
    >
      <LoaderRenderer status={status} statuses={buttonStatuses} />
    </Button>
  );
}
