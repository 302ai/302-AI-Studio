import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./messages/en.json";
import ja from "./messages/ja.json";
import zh from "./messages/zh.json";

// Initialize i18next
i18n.use(initReactI18next).init({
  fallbackLng: "zh",
  resources: {
    en: {
      translation: en,
    },
    zh: {
      translation: zh,
    },
    ja: {
      translation: ja,
    },
  },
});

export default i18n;
