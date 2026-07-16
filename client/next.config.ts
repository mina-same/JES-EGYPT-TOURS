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
      { source: "/de/sonderangebote", destination: "/de/special-offers" },
      { source: "/it/offerte-speciali", destination: "/it/special-offers" },
      { source: "/es/ofertas-especiales", destination: "/es/special-offers" },
      { source: "/de/individualreise-aegypten", destination: "/de/tailor-made" },
      { source: "/it/viaggio-su-misura", destination: "/it/tailor-made" },
      { source: "/es/viaje-a-medida", destination: "/es/tailor-made" },
    ];
  },
  async redirects() {
    return [
      { source: "/de/special-offers", destination: "/de/sonderangebote", permanent: true },
      { source: "/it/special-offers", destination: "/it/offerte-speciali", permanent: true },
      { source: "/es/special-offers", destination: "/es/ofertas-especiales", permanent: true },
      { source: "/de/tailor-made", destination: "/de/individualreise-aegypten", permanent: true },
      { source: "/it/tailor-made", destination: "/it/viaggio-su-misura", permanent: true },
      { source: "/es/tailor-made", destination: "/es/viaje-a-medida", permanent: true },
    ];
  },
  /* config options here */
  reactStrictMode: false,
  turbopack: {},
};

export default nextConfig;
