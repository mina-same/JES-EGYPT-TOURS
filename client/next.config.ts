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
  /* config options here */
  reactStrictMode: false,
  turbopack: {},
};

export default nextConfig;
