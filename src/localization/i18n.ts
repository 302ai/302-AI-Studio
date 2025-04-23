import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  resources: {
    en: {
      translation: en,
    },
    zh: {
      translation: zh,
    },
  },
});
