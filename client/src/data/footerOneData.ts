import { StaticImageData } from 'next/image';

import logo from "@/assets/images/logo-light.png";
import cardImage from "@/assets/images/shapes/footer-card-1-1.png";
import shape1 from "@/assets/images/shapes/footer-shape-1-1.png";
import shape2 from "@/assets/images/shapes/footer-shape-1-2.png";

export interface FooterDataType {
  logo: StaticImageData;
  cardImage: StaticImageData;
  shape1: StaticImageData;
  shape2: StaticImageData;
  contact: {
    email: string;
    phone: string;
    hours: string;
  };
  about: {
    text: string;
    socials: {
      icon: string;
      link: string;
      label: string;
    }[];
  };
  destinations: {
    title: string;
    href: string;
  }[];
  usefulLinks: {
    title: string;
    href: string;
  }[];
  newsletter: {
    text: string;
    privacyLink: string;
  };
}

export const footerOneData: FooterDataType = {
  logo,
  cardImage,
  shape1,
  shape2,
  contact: {
    email: "info@jesegypttours.com",
    phone: "+20 100 743 7271",
    hours: "Hours: Mon-Sun: 24/7",
  },
  about: {
    text: "available, but the majority have suffered alteration in some form by injected humour, or",
    socials: [
      { icon: "icon-facebook", link: "https://facebook.com", label: "Facebook" },
      { icon: "fab fa-twitter", link: "https://twitter.com", label: "Twitter" },
      { icon: "fab fa-instagram", link: "https://instagram.com", label: "Instagram" },
      { icon: "icon-youtube", link: "https://youtube.com", label: "Youtube" },
    ],
  },
  // Internal hrefs are locale-prefixed at render time in FooterOne.
  // Only real, existing routes are listed (no dead template/demo routes).
  destinations: [
    { title: "Tours", href: "/tours" },
    { title: "Special Offers", href: "/special-offers" },
    { title: "Tailor-Made", href: "/tailor-made" },
    { title: "Travel Blog", href: "/blogs" },
    { title: "FAQ", href: "/faq" },
  ],
  usefulLinks: [
    { title: "About Us", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "Wishlist", href: "/wishlist" },
    { title: "Search", href: "/search" },
  ],
  newsletter: {
    text: "Sign up to searing weekly newsletter to get the latest updates.",
    privacyLink: "/faq",
  },
};
