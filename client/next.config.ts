import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* i18n configuration removed since we're using the App Router and middleware.ts */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
  /* Localized slugs for static pages (keep in sync with
     src/lib/url/staticSlugs.ts). Rewrites serve the localized URL from the
     canonical route folder; permanent redirects retire the old English slug
     on non-English locales so each language has ONE indexable URL. */
  async rewrites() {
    return [
      { source: "/en/egypt-dmc", destination: "/en/travel-trade" },
      { source: "/de/aegypten-dmc", destination: "/de/travel-trade" },
      { source: "/it/egitto-dmc", destination: "/it/travel-trade" },
      { source: "/es/egipto-dmc", destination: "/es/travel-trade" },
      { source: "/de/sonderangebote", destination: "/de/special-offers" },
      { source: "/it/offerte-speciali", destination: "/it/special-offers" },
      { source: "/es/ofertas-especiales", destination: "/es/special-offers" },
      { source: "/de/individualreise-aegypten", destination: "/de/tailor-made" },
      { source: "/it/viaggio-su-misura", destination: "/it/tailor-made" },
      { source: "/es/viaje-a-medida", destination: "/es/tailor-made" },
      { source: "/de/kontakt", destination: "/de/contact" },
      { source: "/it/contatti", destination: "/it/contact" },
      { source: "/es/contacto", destination: "/es/contact" },
      { source: "/de/ueber-uns", destination: "/de/about" },
      { source: "/it/chi-siamo", destination: "/it/about" },
      { source: "/es/sobre-nosotros", destination: "/es/about" },
    ];
  },
  async redirects() {
    return [
      /* Egypt DMC now lives at /en/egypt-dmc like every other page. The old
         locale-less URL and the raw route-folder path both retire into it, so
         each language keeps exactly ONE indexable URL. `/en/travel-trade`
         cannot simply be deleted: the route folder IS `travel-trade`, so with
         no rule it would quietly serve the page a second time under a
         non-canonical URL — the duplicate this list exists to prevent. */
      { source: "/egypt-dmc", destination: "/en/egypt-dmc", permanent: true },
      { source: "/travel-trade", destination: "/en/egypt-dmc", permanent: true },
      { source: "/en/travel-trade", destination: "/en/egypt-dmc", permanent: true },
      { source: "/de/travel-trade", destination: "/de/aegypten-dmc", permanent: true },
      { source: "/it/travel-trade", destination: "/it/egitto-dmc", permanent: true },
      { source: "/es/travel-trade", destination: "/es/egipto-dmc", permanent: true },
      { source: "/de/special-offers", destination: "/de/sonderangebote", permanent: true },
      { source: "/it/special-offers", destination: "/it/offerte-speciali", permanent: true },
      { source: "/es/special-offers", destination: "/es/ofertas-especiales", permanent: true },
      { source: "/de/tailor-made", destination: "/de/individualreise-aegypten", permanent: true },
      { source: "/it/tailor-made", destination: "/it/viaggio-su-misura", permanent: true },
      { source: "/es/tailor-made", destination: "/es/viaje-a-medida", permanent: true },
      { source: "/de/contact", destination: "/de/kontakt", permanent: true },
      { source: "/it/contact", destination: "/it/contatti", permanent: true },
      { source: "/es/contact", destination: "/es/contacto", permanent: true },
      { source: "/de/about", destination: "/de/ueber-uns", permanent: true },
      { source: "/it/about", destination: "/it/chi-siamo", permanent: true },
      { source: "/es/about", destination: "/es/sobre-nosotros", permanent: true },
    ];
  },
  /* config options here */
  reactStrictMode: false,
  turbopack: {},
};

export default nextConfig;
