import React from "react";
import ToggleTheme from "@/components/toggle-theme";
import { useTranslation } from "react-i18next";
import LangToggle from "@/components/lang-toggle";
import Footer from "@/components/template/footer";
import InitialIcons from "@/components/template/initial-icons";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <InitialIcons />
        <span>
          <h1 className="font-bold font-mono text-4xl">{t("appName")}</h1>
          <p
            className="text-end text-muted-foreground text-sm uppercase"
            data-testid="pageTitle"
          >
            {t("titleHomePage")}
          </p>
        </span>
        <LangToggle />
        <ToggleTheme />
      </div>
      <Footer />
    </div>
  );
}
