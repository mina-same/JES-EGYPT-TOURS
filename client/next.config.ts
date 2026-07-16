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
    ];
  },
  async redirects() {
    return [
      { source: "/de/special-offers", destination: "/de/sonderangebote", permanent: true },
      { source: "/it/special-offers", destination: "/it/offerte-speciali", permanent: true },
      { source: "/es/special-offers", destination: "/es/ofertas-especiales", permanent: true },
    ];
  },
  /* config options here */
  reactStrictMode: false,
  turbopack: {},
};

export default nextConfig;
