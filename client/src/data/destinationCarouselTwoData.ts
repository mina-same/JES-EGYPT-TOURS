import type { SupportedLocale } from "@/lib/url";

export interface DestinationCarouselItem {
  id: number;
  image: string;
  titleKey: string;
  subtitleKey: string;
  hrefByLocale: Readonly<Record<SupportedLocale, string>>;
}

const destinationCarouselTwoData: readonly DestinationCarouselItem[] = [
  {
    id: 1,
    image: "/images/backgrounds/aswan-nile-felucca-sailing-tour-egypt.webp",
    titleKey: "destinations.aswan.title",
    subtitleKey: "destinations.aswan.subtitle",
    hrefByLocale: {
      en: "/en/aswan",
      de: "/de/assuan",
      it: "/it/assuan",
      es: "/es/asuan",
    },
  },
  {
    id: 2,
    image: "/images/backgrounds/dahab-red-sea-mountains-tour-egypt.webp",
    titleKey: "destinations.dahab.title",
    subtitleKey: "destinations.dahab.subtitle",
    hrefByLocale: {
      en: "/en/search?q=Dahab",
      de: "/de/search?q=Dahab",
      it: "/it/search?q=Dahab",
      es: "/es/search?q=Dahab",
    },
  },
  {
    id: 3,
    image: "/images/backgrounds/giza-pyramids-sphinx-sunset-panorama-egypt.webp",
    titleKey: "destinations.giza.title",
    subtitleKey: "destinations.giza.subtitle",
    hrefByLocale: {
      en: "/en/giza",
      de: "/de/gizeh",
      it: "/it/giza",
      es: "/es/guiza",
    },
  },
  {
    id: 4,
    image: "/images/backgrounds/hatshepsut-temple-luxor-west-bank-tour-egypt.webp",
    titleKey: "destinations.hatshepsut.title",
    subtitleKey: "destinations.hatshepsut.subtitle",
    hrefByLocale: {
      en: "/en/luxor",
      de: "/de/luxor",
      it: "/it/luxor",
      es: "/es/luxor",
    },
  },
  {
    id: 5,
    image: "/images/backgrounds/khan-el-khalili-bazaar-cairo-egypt-shopping-tour.webp",
    titleKey: "destinations.khanElKhalili.title",
    subtitleKey: "destinations.khanElKhalili.subtitle",
    hrefByLocale: {
      en: "/en/cairo",
      de: "/de/kairo",
      it: "/it/il-cairo",
      es: "/es/el-cairo",
    },
  },
  {
    id: 6,
    image: "/images/backgrounds/luxor-nile-hot-air-balloon-view-egypt.webp",
    titleKey: "destinations.luxor.title",
    subtitleKey: "destinations.luxor.subtitle",
    hrefByLocale: {
      en: "/en/luxor",
      de: "/de/luxor",
      it: "/it/luxor",
      es: "/es/luxor",
    },
  },
  {
    id: 7,
    image: "/images/backgrounds/qaitbay-citadel-alexandria-tour-egypt.webp",
    titleKey: "destinations.qaitbay.title",
    subtitleKey: "destinations.qaitbay.subtitle",
    hrefByLocale: {
      en: "/en/alexandria",
      de: "/de/alexandria",
      it: "/it/alessandria",
      es: "/es/alejandria",
    },
  },
  {
    id: 8,
    image: "/images/backgrounds/siwa-oasis-salt-lakes-tour-egypt.webp",
    titleKey: "destinations.siwa.title",
    subtitleKey: "destinations.siwa.subtitle",
    hrefByLocale: {
      en: "/en/siwa-oasis",
      de: "/de/oase-siwa",
      it: "/it/oasi-di-siwa",
      es: "/es/oasis-de-siwa",
    },
  },
];

export default destinationCarouselTwoData;
