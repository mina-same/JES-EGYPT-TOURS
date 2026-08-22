// data.ts
import aboutImg3 from "@/assets/images/shapes/about-1-3.png";
import { PHONE_DISPLAY } from "@/config/contact";

// Display strings live in i18n/locales/*/common.json under "about.*".
// This file keeps only non-translatable config: links, icons, phone, images.
export const aboutOneData = {
  button: {
    link: "tours",
    callIcon: "fab fa-whatsapp",
    phone: PHONE_DISPLAY,
  },
  secondaryButton: {
    link: "tailor-made",
  },
  images: {
    mainImage: "/images/about/private-egypt-tours-planned-around-you-giza-pyramids.webp",
    smallImage: "/images/about/egypt-private-guide-temple-tour.webp",
    popupImage: aboutImg3,
    shape1: "/images/shapes/about-1-1.png",
    shape2: "/images/shapes/about-1-2.png",
  },
};
