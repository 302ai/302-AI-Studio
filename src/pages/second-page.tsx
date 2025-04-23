import React from "react";
import Footer from "@/components/template/footer";
import { useTranslation } from "react-i18next";

export default function SecondPage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <h1 className="font-bold text-4xl">{t("titleSecondPage")}</h1>
      </div>
      <Footer />
    </div>
  );
}
