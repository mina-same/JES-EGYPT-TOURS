// headerData.ts

import homeShowcase1 from "@/assets/images/home-showcase/home-showcase-1.jpg";
import homeShowcase2 from "@/assets/images/home-showcase/home-showcase-2.jpg";
import homeShowcase3 from "@/assets/images/home-showcase/home-showcase-3.jpg";
import logoDark from "@/assets/images/logo-dark.png";
import logoLight from "@/assets/images/logo-light.png";

export const headerData = {
  logo: {
    src: logoDark,
    logoLight: logoLight,
    alt: "gotur HTML",
    width: 160,
    height: 45,
    link: "/",  
  },
  navItems: [
    {
      label: "Home",
      link: "/", 
    },
    {
      label: "About Us",
      link: "about",  
    },
    {
      label: "Destination",
      link: "#",
      dropdown: [
        {
          label: "Destination 01",
          link: "destination-one",  
          options: [
            { label: "Grid", link: "destination-one" },  
            { label: "Left", link: "destination-one-left" },  
            { imageSrc: homeShowcase3, alt: "Destination Showcase 3" },
          ],
        },
      ],
    },
    {
      label: "Contact",
      link: "contact",  
    },
  ],
 
  headerInfo: {
    search: { iconClass: "icon-search-interface-symbol", ariaLabel: "Search" },
    cart: { iconClass: "icon-shopping-carts", ariaLabel: "Cart" },
  },
  button: {
    label: "Tailor-Made",
    link: "contact",  
    iconClass: "icon-paper-plane",
  },
};
