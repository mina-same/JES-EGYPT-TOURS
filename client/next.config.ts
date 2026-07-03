import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* i18n configuration removed since we're using the App Router and middleware.ts */
  webpack: (config, { isServer, dev }) => {
    config.module.rules.push({
      test: /\.(mjs|cjs)$/,
      type: 'javascript/auto',
    });

    // Fix for ChunkLoadError and vendor chunk issues
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix',
              priority: 15,
              chunks: 'all',
            },
          },
        },
      };
    }

    // Fix for @radix-ui module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@radix-ui/react-collapsible': require.resolve('@radix-ui/react-collapsible'),
      '@radix-ui/react-dialog': require.resolve('@radix-ui/react-dialog'),
      '@radix-ui/react-dropdown-menu': require.resolve('@radix-ui/react-dropdown-menu'),
      '@radix-ui/react-label': require.resolve('@radix-ui/react-label'),
      '@radix-ui/react-select': require.resolve('@radix-ui/react-select'),
      '@radix-ui/react-separator': require.resolve('@radix-ui/react-separator'),
      '@radix-ui/react-slot': require.resolve('@radix-ui/react-slot'),
      '@radix-ui/react-switch': require.resolve('@radix-ui/react-switch'),
      '@radix-ui/react-toast': require.resolve('@radix-ui/react-toast'),
      '@radix-ui/react-tooltip': require.resolve('@radix-ui/react-tooltip'),
    };

    // Disable chunking in development to avoid vendor chunk issues
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        runtimeChunk: false,
      };
    }

    return config;
  },
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
