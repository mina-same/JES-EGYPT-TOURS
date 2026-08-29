// Auto-structured: every namespace for one locale, in ONE module, so the
// bundler emits it as a single chunk that is only ever pulled in on the
// server. See src/i18n/bundles/index.ts for why.
import common from "@/i18n/locales/de/common.json";
import faq from "@/i18n/locales/de/faq.json";
import contact from "@/i18n/locales/de/contact.json";
import wishlist from "@/i18n/locales/de/wishlist.json";
import tailorMade from "@/i18n/locales/de/tailorMade.json";
import tours from "@/i18n/locales/de/tours.json";
import search from "@/i18n/locales/de/search.json";
import blogs from "@/i18n/locales/de/blogs.json";
import specialOffers from "@/i18n/locales/de/specialOffers.json";

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
