/**
 * next.config.prod.js — Production build configuration.
 *
 * DEPLOY RECONCILIATION ITEM:
 * The prod server runs uncommitted code (git-apply to live tree). If the
 * server had a hand-edited version of this file, reconcile manually before
 * deploying. This file is now in-repo and becomes the authoritative prod
 * config going forward.
 *
 * build:prod cp-s this into next.config.build.js, then `next build` reads it.
 * Unlike next.config.js (which disables SW in dev), this always enables the
 * serwist service worker so the prod build emits public/sw.js.
 */

/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Always active in prod builds
  disable: false,
})

const nextConfig = {
  // Prod: no dev-only origin allowlist
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pro.beldify.com' },
      { protocol: 'https', hostname: 'api.beldify.com' },
      { protocol: 'https', hostname: 'www.beldify.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'eu2.contabostorage.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Skip linting and type checking on prod builds for speed
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Security and cache headers (identical to next.config.js)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), push=(self)',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
      {
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Service worker must never be cached immutably — browser needs fresh
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },

  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@headlessui/react',
      'pusher-js',
      'lucide-react',
      'react-icons',
      '@heroicons/react',
      'date-fns',
      'react-datepicker',
      'swiper',
      'i18next',
      'react-i18next',
      'zod',
      'axios',
    ],
  },

  compiler: {
    removeConsole: true,
  },

  async redirects() {
    return [
      { source: '/tailoring', destination: '/services/tailoring', permanent: true },
      { source: '/journal', destination: '/about', permanent: false },
      { source: '/category/:slug*', destination: '/categories/:slug*', permanent: true },
      { source: '/categories/rgal', destination: '/categories/men', permanent: true },
      // Blade seller dashboard owns store-profile editing; bridge via register.
      { source: '/seller/store-profile', destination: '/seller/register', permanent: true },
    ]
  },

  // Serve backend-stored media (category/product images, banners) under the
  // www origin so the browser never has to reach pro.beldify.com directly.
  // The Next server proxies /storage/* to the backend; ASSET_URL is set to
  // https://www.beldify.com so the API emits www URLs that land here.
  async rewrites() {
    return [
      { source: '/storage/:path*', destination: 'https://pro.beldify.com/storage/:path*' },
    ]
  },
}

module.exports = withBundleAnalyzer(withSerwist(nextConfig))
