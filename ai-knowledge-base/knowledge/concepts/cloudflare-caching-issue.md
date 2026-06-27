---
name: Cloudflare CDN Caching Issue
description: Long-lived Cloudflare edge cache pinning stale Next.js chunks and how to resolve it
type: concept
tags: [nextjs, docker, cloudflare, cache, atlas, design-system]
sources: [daily/2026-05-14.md]
created: "2026-05-15"
updated: "2026-05-15"
---
# Cloudflare CDN Caching Issue

## Overview
The Beldify domain sits behind Cloudflare. Next.js dev-mode bundles are served with `Cache-Control: public, max-age=31536000, immutable`, which causes Cloudflare to pin chunks (Navbar, Footer) for up to a year. After any frontend code change, origin has the new code, but Cloudflare's edge continues serving the stale version to all visitors.

## Key Points
- Symptom: `cf-cache-status: HIT` with `age: 340000+` seconds on `/_next/static/chunks/app/layout.js`
- Root cause: `immutable` header tells CF the resource will never change — so it never re-validates
- Origin bypass test: hit origin directly (bypassing CF) to confirm whether the new code is actually deployed
- Immediate fix: Cloudflare Dashboard → beldify.com → Caching → Purge Cache → Custom Purge (paste chunk URLs) or Purge Everything
- Permanent fix: add `headers()` in `next.config.js` to override cache for `/_next/static/chunks/app/*` to `max-age=60, must-revalidate`

## Details
On 2026-05-14, after porting the Navbar and Footer to the new Beldify Atlas design, visitors still saw the old navbar. Curl revealed `cf-cache-status: HIT` and `age: 340982`, meaning CF had frozen the chunk ~95 hours earlier.

When hitting origin directly (bypassing CF), the 6.2 MB chunk contained `bg-amber-50/95` (new Atlas navbar code). CF's edge was serving an 8.2 MB chunk with the old indigo-gradient navbar. A Docker rebuild produced the correct code, but CF still intercepted all visitors before they reached origin.

### Permanent Next.js Fix
```js
// next.config.js
async headers() {
  return [
    {
      source: '/_next/static/chunks/app/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=60, must-revalidate',
        },
      ],
    },
  ];
},
```

This ensures CF re-validates chunks within 60 seconds, so future deploys propagate automatically without manual purges.

## Purge Procedure
1. Open https://dash.cloudflare.com → beldify.com
2. Caching → Configuration → Purge Cache → Custom Purge
3. Paste affected chunk URLs, or click Purge Everything

## Related Concepts
- [[concepts/docker-deployment]] — Origin container serving the correct code
- [[concepts/atlas-design-system]] — The visual changes whose delivery was blocked by CF cache
- [[entities/nextjs]] — Framework producing the `immutable` chunk headers

## Sources
- [[daily/2026-05-14.md]] — Issue discovered; root cause confirmed; permanent fix added to `next.config.js`
