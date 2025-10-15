/**
 * Configuração de produção para Next.js - RodoCheck Frontend
 * Este arquivo contém configurações otimizadas para produção
 */

/** @type {import('next').NextConfig} */

// Configurações de produção
const nextConfig = {
  // Configurações de output para produção
  output: 'standalone',
  
  // Configurações de compressão
  compress: true,
  
  // Configurações de performance
  poweredByHeader: false, // Remover header X-Powered-By por segurança
  
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
        ],
      },
    ];
  },

  // Configurações de redirecionamento
  async redirects() {
    return [
      // Redirecionar HTTP para HTTPS em produção
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://:path*',
        permanent: true,
      },
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
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    // Configurações de bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
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

  // Configurações de experimental (apenas para produção)
  experimental: {
    // Otimizações de performance
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons'],
    
    // Configurações de server actions
    serverActions: {
      bodySizeLimit: '10mb',
      serverActionsTimeout: 120,
    },
  },

  // Configurações de TypeScript
  typescript: {
    ignoreBuildErrors: false, // CRÍTICO: Não ignorar erros em produção
  },

  // Configurações de ESLint
  eslint: {
    ignoreDuringBuilds: false, // CRÍTICO: Não ignorar erros em produção
  },
};

module.exports = nextConfig;

