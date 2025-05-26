import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const LazyProvider = lazy(() =>
  import("./provider").then((module) => ({
    default: module.Provider,
  }))
);
const LazyProviderModel = lazy(() =>
  import("./provider-model").then((module) => ({
    default: module.ProviderModel,
  }))
);

export function ModelSettings() {
  const { t } = useTranslation();

  const [shouldLoadProvider, setShouldLoadProvider] = useState(false);
  const [shouldLoadProviderModel, setShouldLoadProviderModel] = useState(false);

  useEffect(() => {
    setShouldLoadProvider(true);

    const timer = setTimeout(() => {
      setShouldLoadProviderModel(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {shouldLoadProvider ? (
        <Suspense
          fallback={
            <div className="flex h-1/2 items-center justify-center">
              <div className="text-muted-fg">
                {t("settings.model-settings.loading")}
              </div>
            </div>
          }
        >
          <LazyProvider />
        </Suspense>
      ) : (
        <div className="flex h-1/2 items-center justify-center">
          <div className="text-muted-fg">
            {t("settings.model-settings.loading")}
          </div>
        </div>
      )}

      {shouldLoadProviderModel ? (
        <Suspense
          fallback={
            <div className="flex h-1/2 items-center justify-center">
              <div className="text-muted-fg">
                {t("settings.model-settings.loading")}
              </div>
            </div>
          }
        >
          <LazyProviderModel />
        </Suspense>
      ) : (
        <div className="flex h-1/2 items-center justify-center">
          <div className="text-muted-fg">
            {t("settings.model-settings.loading")}
          </div>
        </div>
      )}
    </div>
  );
}
