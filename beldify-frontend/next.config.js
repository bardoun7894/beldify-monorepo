/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Disable SW in development — avoids stale cache fighting hot-reload
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
  // Next.js 15 dev-mode allowlist: prod domain serves the dev server through CF,
  // so the browser's origin is www.beldify.com, not localhost. Without this,
  // /_next/* chunk fetches are blocked → "Cannot read properties of undefined
  // (reading 'call')" at the RSC→Client boundary.
  allowedDevOrigins: ['www.beldify.com', 'beldify.com', 'pro.beldify.com'],

  // Enhanced image optimization with remotePatterns
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'http', hostname: '31.220.95.90' },
      { protocol: 'https', hostname: '31.220.95.90' },
      { protocol: 'https', hostname: 'eu2.contabostorage.com' },
      { protocol: 'https', hostname: 'pro.beldify.com' },
      { protocol: 'https', hostname: 'api.beldify.com' },
      { protocol: 'https', hostname: 'www.beldify.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack optimizations for development
  webpack: (config, { dev }) => {
    if (dev) {
      // Speed up development builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
      };

      // Reduce filesystem polling for better performance
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
      };
    }

    // Let Next.js handle splitChunks internally - custom overrides break chunk loading
    return config;
  },

  // Allow dev access from the server IP
  allowedDevOrigins: ['http://91.230.110.187:3001', 'http://91.230.110.187:3100'],

  // Skip linting and type checking for speed
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Enhanced security and performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Permanent fix for Cloudflare edge-cache pinning stale chunks: app/ chunks
        // in next dev are not content-hashed, so the immutable header makes CF cache
        // them as if they were. Override to 60s + revalidate so deploys propagate.
        source: '/_next/static/chunks/app/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, must-revalidate' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Service worker must never be cached immutably — browser needs fresh copy
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },

  // Experimental features for better performance
  experimental: {
    // optimizeCss removed - causes issues with CSS loading in Next.js 15
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

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Permanent redirects for legacy / friendly URLs
  async redirects() {
    return [
      { source: '/tailoring', destination: '/services/tailoring', permanent: true },
      { source: '/journal', destination: '/about', permanent: false },
      // Canonicalize category routes: /category/* → /categories/* (the plural form
      // is what the homepage/nav links emit; /category/* is a legacy alias).
      { source: '/category/:slug*', destination: '/categories/:slug*', permanent: true },
      // Legacy transliterated "men" alias used on the homepage CTA.
      { source: '/categories/rgal', destination: '/categories/men', permanent: true },
    ];
  },

  // Proxy backend-stored media under the www origin (see next.config.prod.js).
  async rewrites() {
    return [
      { source: '/storage/:path*', destination: 'https://pro.beldify.com/storage/:path*' },
    ];
  },

  // NOTE: A second `async headers()` used to live here and silently overrode the
  // comprehensive one above (duplicate object key — last one wins), disabling the
  // security headers, `/api` no-store, and `/_next/static` immutable caching. It
  // also documented running `next dev` in production, which is what made every
  // navigation re-download unminified, uncacheable chunks. Both are fixed: prod
  // now runs a real `next build` + `next start` (content-hashed, immutable chunks),
  // so the single headers() above is the source of truth.
}

module.exports = withBundleAnalyzer(withSerwist(nextConfig));