import { useTranslation } from "react-i18next";

export function ModelList() {
  const { t } = useTranslation();

  return <div>{t("settings.model-settings.model-list.label")}</div>;
}
