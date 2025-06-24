import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translations directly
import enTranslation from "./locales/en/translation.json";
import esTranslation from "./locales/es/translation.json";

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslation,
    },
    es: {
      translation: esTranslation,
    },
  },
  lng: "es", // default language
  fallbackLng: "es",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
