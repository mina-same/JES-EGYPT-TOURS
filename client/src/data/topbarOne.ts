// app/data/topbarOne.ts
import { waHref, TEL_HREF, PHONE_DISPLAY } from "@/config/contact";

export const topbarOne = {
    contactInfo: [
      {
        type: "phone",
        iconClass: "icon-telephone",
        label: PHONE_DISPLAY,
        href: TEL_HREF,
      },
      {
        type: "email",
        iconClass: "icon-email",
        label: "info@jesegypttours.com",
        href: "mailto:info@jesegypttours.com",
      },
    ],
    contactInfoTwo: [
      {
        type: "email",
        iconClass: "icon-email",
        label: "info@jesegypttours.com",
        href: "mailto:info@jesegypttours.com",
      },
      {
        type: "whatsapp",
        iconClass: "fab fa-whatsapp",
        label: PHONE_DISPLAY,
        href: waHref(),
      },
      
    ],
    address: {
      iconClass: "fab fa-whatsapp",
      label: PHONE_DISPLAY,
      href: waHref(),
    },
    socialLinks: [
      {
        platform: "Facebook",
        iconClass: "icon-facebook",
        href: "https://facebook.com",
      },
      {
        platform: "Twitter",
        iconClass: "icon-twitter",
        href: "https://twitter.com",
      },
      {
        platform: "LinkedIn",
        iconClass: "icon-linkedin",
        href: "https://instagram.com", // original HTML had LinkedIn icon but Instagram URL
      },
      {
        platform: "Youtube",
        iconClass: "icon-youtube",
        href: "https://youtube.com",
      },
    ],
  };
  