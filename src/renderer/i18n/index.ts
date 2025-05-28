import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "./messages/en/translation.json";
import jaTranslation from "./messages/ja/translation.json";
import zhTranslation from "./messages/zh/translation.json";

const { configService } = window.service;

// Initialize i18next
i18n.use(initReactI18next).init({
  fallbackLng: "zh",
  lng: ((await configService.getLanguage()) || "zh-CN").split("-")[0],
  resources: {
    zh: {
      translation: zhTranslation,
    },
    en: {
      translation: enTranslation,
    },
    ja: {
      translation: jaTranslation,
    },
  },
});

export default i18n;
