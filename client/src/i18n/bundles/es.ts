// Auto-structured: every namespace for one locale, in ONE module, so the
// bundler emits it as a single chunk that is only ever pulled in on the
// server. See src/i18n/bundles/index.ts for why.
import common from "@/i18n/locales/es/common.json";
import faq from "@/i18n/locales/es/faq.json";
import contact from "@/i18n/locales/es/contact.json";
import wishlist from "@/i18n/locales/es/wishlist.json";
import tailorMade from "@/i18n/locales/es/tailorMade.json";
import tours from "@/i18n/locales/es/tours.json";
import search from "@/i18n/locales/es/search.json";
import blogs from "@/i18n/locales/es/blogs.json";
import specialOffers from "@/i18n/locales/es/specialOffers.json";

const bundle = {
  common,
  faq,
  contact,
  wishlist,
  tailorMade,
  tours,
  search,
  blogs,
  specialOffers,
};

export default bundle;
