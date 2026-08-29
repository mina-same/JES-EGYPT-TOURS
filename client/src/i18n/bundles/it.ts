// Auto-structured: every namespace for one locale, in ONE module, so the
// bundler emits it as a single chunk that is only ever pulled in on the
// server. See src/i18n/bundles/index.ts for why.
import common from "@/i18n/locales/it/common.json";
import faq from "@/i18n/locales/it/faq.json";
import contact from "@/i18n/locales/it/contact.json";
import wishlist from "@/i18n/locales/it/wishlist.json";
import tailorMade from "@/i18n/locales/it/tailorMade.json";
import tours from "@/i18n/locales/it/tours.json";
import search from "@/i18n/locales/it/search.json";
import blogs from "@/i18n/locales/it/blogs.json";
import specialOffers from "@/i18n/locales/it/specialOffers.json";

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
