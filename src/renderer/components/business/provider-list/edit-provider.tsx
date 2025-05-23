import { useTranslation } from "react-i18next";

export function EditProvider() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.model-settings.model-provider.edit-provider-form",
  });

  return <div>EditProvider</div>;
}
