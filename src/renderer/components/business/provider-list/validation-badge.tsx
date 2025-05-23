import { Badge } from "@renderer/components/ui/badge";
import { TailChase } from "ldrs/react";
import { useTranslation } from "react-i18next";
import { IoKeyOutline } from "react-icons/io5";
import { VscCheck, VscClose } from "react-icons/vsc";
import { LoaderRenderer } from "../loader-renderer";

type ValidationStatus = "unverified" | "loading" | "success" | "failed";

interface ValidationBadgeProps {
  status: ValidationStatus;
  className?: string;
}

export function ValidationBadge({ status, className }: ValidationBadgeProps) {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.add-provider-form",
  });

  const badgeStatuses = {
    unverified: {
      icon: <IoKeyOutline className="size-4" />,
      text: t("unverified"),
    },
    loading: {
      icon: <TailChase size="16" color="currentColor" />,
      text: t("checking"),
    },
    success: {
      icon: <VscCheck className="size-4" />,
      text: t("verified"),
    },
    failed: {
      icon: <VscClose className="size-4" />,
      text: t("verification-failed"),
    },
  } as const;

  const getBadgeIntent = (status: ValidationStatus) => {
    switch (status) {
      case "unverified":
      case "loading":
        return "primary";
      case "success":
        return "success";
      case "failed":
        return "danger";
      default:
        return "primary";
    }
  };

  return (
    <Badge intent={getBadgeIntent(status)} shape="square">
      <LoaderRenderer
        status={status}
        statuses={badgeStatuses}
        className={className}
      />
    </Badge>
  );
}
