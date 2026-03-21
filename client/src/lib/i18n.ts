 "use client";
 
 import i18n from "i18next";
 import { initReactI18next } from "react-i18next";
 import LanguageDetector from "i18next-browser-languagedetector";
 import enCommon from "@/i18n/locales/en/common.json";
 import deCommon from "@/i18n/locales/de/common.json";
 import itCommon from "@/i18n/locales/it/common.json";
import esCommon from "@/i18n/locales/es/common.json";

import enFaq from "@/i18n/locales/en/faq.json";
import deFaq from "@/i18n/locales/de/faq.json";
import itFaq from "@/i18n/locales/it/faq.json";
import esFaq from "@/i18n/locales/es/faq.json";

import enContact from "@/i18n/locales/en/contact.json";
import deContact from "@/i18n/locales/de/contact.json";
import itContact from "@/i18n/locales/it/contact.json";
import esContact from "@/i18n/locales/es/contact.json";
 
 if (!i18n.isInitialized) {
   i18n
     .use(initReactI18next)
     .use(LanguageDetector)
     .init({
       resources: {
         en: { common: enCommon, faq: enFaq, contact: enContact },
         de: { common: deCommon, faq: deFaq, contact: deContact },
         it: { common: itCommon, faq: itFaq, contact: itContact },
         es: { common: esCommon, faq: esFaq, contact: esContact },
       },
       fallbackLng: "en",
       supportedLngs: ["en", "de", "it", "es"],
       defaultNS: "common",
       ns: ["common", "faq", "contact"],
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
