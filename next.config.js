
/** @type {import('next').NextConfig} */

// Configurações baseadas no ambiente
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  // Configurações experimentais (apenas para desenvolvimento)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      serverActionsTimeout: 120,
    },
  },

  // Configurações de TypeScript - CRÍTICO: Não ignorar erros em produção
  typescript: {
    ignoreBuildErrors: isDevelopment, // Apenas em desenvolvimento
  },

  // Configurações de ESLint - CRÍTICO: Não ignorar erros em produção
  eslint: {
    ignoreDuringBuilds: isDevelopment, // Apenas em desenvolvimento
  },

  // Configurações de imagens otimizadas
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Otimizações de imagem para produção
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false, // Segurança: não permitir SVG
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Configurações de compressão
  compress: true,

  // Configurações de performance
  poweredByHeader: false, // Remover header X-Powered-By por segurança

  // Configurações de output para produção
  output: isProduction ? 'standalone' : undefined,

  // Configurações de headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Configurações de redirecionamento
  async redirects() {
    return [
      // Redirecionamentos de produção se necessário
    ];
  },

  // Configurações de rewrites para API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },

  // Configurações de webpack para otimização
  webpack: (config, { dev, isServer }) => {
    // Otimizações para produção
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // Configurações de ambiente
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Configurações de trailing slash
  trailingSlash: false,

  // Configurações de base path (se necessário)
  basePath: '',

  // Configurações de asset prefix (se necessário)
  assetPrefix: '',

  // Configurações de distDir
  distDir: '.next',

  // Configurações de generateEtags
  generateEtags: true,

  // Configurações de pageExtensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],

  // Configurações de reactStrictMode
  reactStrictMode: true,

  // Configurações de swcMinify
  swcMinify: true,
};

module.exports = nextConfig;
