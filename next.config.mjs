import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-a7e412da142148a89892728e019eb7e2.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Évite les race conditions sur Windows avec vendor-chunks en dev
    if (dev && isServer) {
      config.optimization = {
        ...(config.optimization ?? {}),
        splitChunks: false,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
