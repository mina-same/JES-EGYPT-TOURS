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

import enWishlist from "@/i18n/locales/en/wishlist.json";
import deWishlist from "@/i18n/locales/de/wishlist.json";
import itWishlist from "@/i18n/locales/it/wishlist.json";
import esWishlist from "@/i18n/locales/es/wishlist.json";

import enTailorMade from "@/i18n/locales/en/tailorMade.json";
import deTailorMade from "@/i18n/locales/de/tailorMade.json";
import itTailorMade from "@/i18n/locales/it/tailorMade.json";
import esTailorMade from "@/i18n/locales/es/tailorMade.json";

import enTours from "@/i18n/locales/en/tours.json";
import deTours from "@/i18n/locales/de/tours.json";
import itTours from "@/i18n/locales/it/tours.json";
import esTours from "@/i18n/locales/es/tours.json";

import enSearch from "@/i18n/locales/en/search.json";
import deSearch from "@/i18n/locales/de/search.json";
import itSearch from "@/i18n/locales/it/search.json";
import esSearch from "@/i18n/locales/es/search.json";

import enBlogs from "@/i18n/locales/en/blogs.json";
import deBlogs from "@/i18n/locales/de/blogs.json";
import itBlogs from "@/i18n/locales/it/blogs.json";
import esBlogs from "@/i18n/locales/es/blogs.json";
 
 if (!i18n.isInitialized) {
   i18n
     .use(initReactI18next)
     .use(LanguageDetector)
     .init({
       resources: {
         en: { common: enCommon, faq: enFaq, contact: enContact, wishlist: enWishlist, tailorMade: enTailorMade, tours: enTours, search: enSearch, blogs: enBlogs },
         de: { common: deCommon, faq: deFaq, contact: deContact, wishlist: deWishlist, tailorMade: deTailorMade, tours: deTours, search: deSearch, blogs: deBlogs },
         it: { common: itCommon, faq: itFaq, contact: itContact, wishlist: itWishlist, tailorMade: itTailorMade, tours: itTours, search: itSearch, blogs: itBlogs },
         es: { common: esCommon, faq: esFaq, contact: esContact, wishlist: esWishlist, tailorMade: esTailorMade, tours: esTours, search: esSearch, blogs: esBlogs },
       },
       fallbackLng: "en",
       supportedLngs: ["en", "de", "it", "es"],
       defaultNS: "common",
       ns: ["common", "faq", "contact", "wishlist", "tailorMade", "tours", "search", "blogs"],
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
