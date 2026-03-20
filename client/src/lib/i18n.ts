 "use client";
 
 import i18n from "i18next";
 import { initReactI18next } from "react-i18next";
 import LanguageDetector from "i18next-browser-languagedetector";
 import enCommon from "@/i18n/locales/en/common.json";
 import deCommon from "@/i18n/locales/de/common.json";
 import itCommon from "@/i18n/locales/it/common.json";
import esCommon from "@/i18n/locales/es/common.json";
 
 if (!i18n.isInitialized) {
   i18n
     .use(initReactI18next)
     .use(LanguageDetector)
     .init({
       resources: {
         en: { common: enCommon },
         de: { common: deCommon },
         it: { common: itCommon },
         es: { common: esCommon },
       },
       fallbackLng: "en",
       supportedLngs: ["en", "de", "it", "es"],
       defaultNS: "common",
       ns: ["common"],
       detection: {
         order: ["path", "cookie", "localStorage", "navigator"],
         caches: ["cookie", "localStorage"],
         lookupCookie: "NEXT_LOCALE",
         lookupFromPathIndex: 0,
       },
       interpolation: {
         escapeValue: false,
       },
     });
 }
 
 export default i18n;
