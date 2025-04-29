import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./messages/en.json";
import ja from "./messages/ja.json";
import zh from "./messages/zh.json";
import { defaultLanguage } from "@main/constant";

// Initialize i18next
i18n.use(initReactI18next).init({
  fallbackLng: "zh",
  lng: ((await window.api.getLanguage()) || defaultLanguage).split("-")[0],
  resources: {
    zh: {
      translation: zh,
    },
    en: {
      translation: en,
    },
    ja: {
      translation: ja,
    },
  },
});

export default i18n;
