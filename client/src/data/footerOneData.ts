import { PHONE_DISPLAY } from "@/config/contact";
// Social profiles live in config/contact.ts — see SOCIAL_PROFILES for why.
import { StaticImageData } from 'next/image';
import { BLOG_HUB_HREF_BY_LOCALE } from "@/data/blogHub";
import type { SupportedLocale } from "@/lib/url";

import logo from "@/assets/images/logo-light.png";
import cardImage from "@/assets/images/shapes/footer-card-1-1.png";
import shape1 from "@/assets/images/shapes/footer-shape-1-1.png";
import shape2 from "@/assets/images/shapes/footer-shape-1-2.png";

/**
 * Non-translatable footer config only: images, links, icons, contact details.
 *
 * Every DISPLAY string now lives in i18n/locales/*\/common.json under
 * "footer.*" — the widget titles, the company description and the link labels
 * were English literals here, so the German, Italian and Spanish footers all
 * rendered in English. Each link carries a `translationKey` instead of a
 * `title`, following the same convention aboutOne.ts already uses.
 */
export type FooterLink = {
  /** Key under "footer.*" in common.json. */
  translationKey: string;
} & (
  | {
      /** Locale-prefixed at render time by localizeInternalUrl. */
      href: string;
      hrefByLocale?: undefined;
    }
  | {
      /**
       * For a CMS page, which has its own slug in each language and so cannot
       * be one path with the locale put in front.
       */
      hrefByLocale: Readonly<Record<SupportedLocale, string>>;
      href?: undefined;
    }
);

export interface FooterDataType {
  logo: StaticImageData;
  cardImage: StaticImageData;
  shape1: StaticImageData;
  shape2: StaticImageData;
  contact: {
    email: string;
    phone: string;
  };
  destinations: FooterLink[];
  usefulLinks: FooterLink[];
}

export const footerOneData: FooterDataType = {
  logo,
  cardImage,
  shape1,
  shape2,
  contact: {
    email: "info@jesegypttours.com",
    phone: PHONE_DISPLAY,
  },
  // Only real, existing routes are listed (no dead template/demo routes).
  destinations: [
    { translationKey: "footer.destinations.specialOffers", href: "/special-offers" },
    { translationKey: "footer.destinations.tailorMade", href: "/tailor-made" },
    { translationKey: "footer.destinations.blog", hrefByLocale: BLOG_HUB_HREF_BY_LOCALE },
    { translationKey: "footer.destinations.faq", href: "/faq" },
  ],
  usefulLinks: [
    { translationKey: "footer.travelTrade", href: "/travel-trade" },
    { translationKey: "footer.usefulLinks.about", href: "/about" },
    { translationKey: "footer.usefulLinks.contact", href: "/contact" },
    { translationKey: "footer.usefulLinks.paymentPolicy", href: "/payment-cancellation-policy" },
    { translationKey: "footer.usefulLinks.wishlist", href: "/wishlist" },
    { translationKey: "footer.usefulLinks.search", href: "/search" },
  ],
};
