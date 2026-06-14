import type { Metadata } from 'next';
import { Poppins, Montserrat, Rubik, Playfair_Display, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import ClientProvider from '@/providers/ClientProvider';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import FloatingSupportButton from '@/components/support/FloatingSupportButton';
import PWAProviderWrapper from '@/providers/PWAProviderWrapper';
import dynamic from 'next/dynamic';

// Lazy-load AssistantWidget so the launcher doesn't bloat the root bundle.
// No ssr:false here — layout.tsx is a Server Component so ssr:false is forbidden.
// AssistantWidget is 'use client' so it won't SSR its interactive parts anyway.
const AssistantWidget = dynamic(
  () => import('@/components/assistant/AssistantWidget').then((m) => ({ default: m.AssistantWidget }))
);

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
});

const rubik = Rubik({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rubik',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beldify.com'),
  title: 'Beldify',
  description: 'Bringing Moroccan Traditional Fashion to the Modern World',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Beldify',
    // iOS splash screens — fallback to the one icon we have
    startupImage: [
      '/icons/apple-icon-180.png',
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Beldify',
    title: 'Beldify - Moroccan Traditional Fashion',
    description: 'Bringing Moroccan Traditional Fashion to the Modern World',
  },
  twitter: {
    card: 'summary',
    title: 'Beldify - Moroccan Traditional Fashion',
    description: 'Bringing Moroccan Traditional Fashion to the Modern World',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/favicon-32x32.png',
  },
  other: {
    'application-name': 'Beldify',
    'msapplication-config': '/icons/browserconfig.xml',
    'msapplication-TileColor': '#6366f1',
    'msapplication-tap-highlight': 'no',
  },
};

export function generateViewport() {
  return {
    themeColor: '#6366f1',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ma"
      dir="rtl"
      suppressHydrationWarning
      className={`${poppins.variable} ${montserrat.variable} ${rubik.variable} ${playfair.variable} ${ibmPlexArabic.variable}`}
    >
      <body suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ClientProvider>
          <div id="main-content" className="min-h-screen pb-16 md:pb-0">{children}</div>
          <PWAProviderWrapper />
          <FloatingSupportButton />
          <AssistantWidget />
          <MobileBottomNav />
        </ClientProvider>
      </body>
    </html>
  );
}
