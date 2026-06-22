'use client';

/**
 * AnalyticsScripts — injects third-party analytics pixel scripts.
 *
 * Each vendor is ONLY rendered when its corresponding env var is present.
 * When all vars are empty (the default) this component renders nothing,
 * causing zero console noise and zero network requests.
 *
 * Mount in src/app/layout.tsx inside <body> so scripts run after hydration.
 *
 * Activation — set in .env.local (never hardcode IDs here):
 *   NEXT_PUBLIC_GA4_ID            — Google Analytics 4  (e.g. G-XXXXXXXXXX)
 *   NEXT_PUBLIC_GTM_ID            — Google Tag Manager  (e.g. GTM-XXXXXXX)
 *   NEXT_PUBLIC_META_PIXEL_ID     — Meta / Facebook Pixel (numeric ID)
 *   NEXT_PUBLIC_TIKTOK_PIXEL_ID   — TikTok Pixel (alphanumeric ID)
 */

import Script from 'next/script';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? '';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? '';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? '';

export default function AnalyticsScripts() {
  return (
    <>
      {/* ── Google Tag Manager ─────────────────────────────────────────────── */}
      {GTM_ID && (
        <>
          {/* GTM <noscript> iframe should be placed in <body> via layout.tsx */}
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
              `.trim(),
            }}
          />
        </>
      )}

      {/* ── Google Analytics 4 (direct, without GTM) ─────────────────────── */}
      {GA4_ID && !GTM_ID && (
        <>
          <Script
            id="ga4-load"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_ID}', { send_page_view: false });
              `.trim(),
            }}
          />
        </>
      )}

      {/* ── Meta (Facebook) Pixel ────────────────────────────────────────── */}
      {META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');
            `.trim(),
          }}
        />
      )}

      {/* ── TikTok Pixel ─────────────────────────────────────────────────── */}
      {TIKTOK_PIXEL_ID && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},
ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;
e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load('${TIKTOK_PIXEL_ID}');ttq.page();}(window,document,'ttq');
            `.trim(),
          }}
        />
      )}
    </>
  );
}
