
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      serverActionsTimeout: 120,
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      }
    ],
  },
};

module.exports = nextConfig;
