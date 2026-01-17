// data.ts
import aboutImg1 from "@/assets/images/about/about-1-1.jpg";
import aboutImg2 from "@/assets/images/about/about-s-1-1.jpg";
import aboutImg3 from "@/assets/images/shapes/about-1-3.png";
import aboutShape1 from "@/assets/images/shapes/about-1-1.png";
import aboutShape2 from "@/assets/images/shapes/about-1-2.png";

export const aboutOneData = {
  title: "Travel place for Your & your Family",
  subtitle: "About JES Egypt Tours",
  description:
    "It is a long established fact that a reader will be distracted the readable content of a page when looking at layout the point.",
  features: [
    {
      icon: "icon-check-star",
      text: "Easy & Quick Booking",
    },
    {
      icon: "icon-check-star",
      text: "Best Price Guarantee",
    },
  ],
  mission: {
    icon: "icon-misstion",
    title: "Mission & Vision",
    text: "Ut vehiculadictumst. Maecenas ante.",
  },
  button: {
    text: "Discover More",
    link: "blog-details-left",
    callIcon: "icon-telephone",
    callText: "Call Us Now",
    phone: "+208-555-0112",
  },
  images: {
    mainImage: aboutImg1,
    smallImage: aboutImg2,
    popupImage: aboutImg3,
    shape1: aboutShape1,
    shape2: aboutShape2,
  },
};
