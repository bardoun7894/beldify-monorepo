---
name: Connection: Atlas Design System and Production Deployment
description: How the Stitch-generated design system interacts with Docker, Cloudflare, and Next.js config to reach end-users
type: connection
connects:
  - concepts/atlas-design-system
  - concepts/docker-deployment
  - concepts/cloudflare-caching-issue
  - concepts/nextjs-image-config
sources: [daily/2026-05-14.md]
created: 2026-05-15
updated: 2026-05-15
---

# Connection: Atlas Design System and Production Deployment

## The Connection
Getting a new design from Stitch HTML preview to a real user's browser requires navigating three independent caching layers: Next.js webpack cache (bind-mounted, survives container restarts), Docker image layer cache (survives `docker compose restart`), and Cloudflare edge cache (survives server-side rebuilds). Each layer can independently hold a stale version.

## Key Insight
Code correctness (the right design in `page.tsx`) and code delivery (that design actually reaching visitors) are separate problems in Beldify's stack. A developer can confirm new Stitch code is in the container and still have all visitors see the old UI for hours or days because CF has frozen the chunk.

The correct mental model for a Beldify deploy:

```
Stitch HTML reference
       ↓
frontend-engineer agent edits page.tsx (source)
       ↓
Bind-mount: source synced to container live (HMR)
       ↓
Next.js webpack cache (.next/) — must wipe on config changes
       ↓
Docker image — must rebuild with --no-cache for dependency changes
       ↓
Cloudflare edge cache — must purge after any JS chunk content change
       ↓
Visitor browser cache — cleared by versioned chunk filenames (Next.js default)
```

## Evidence
On 2026-05-14, Navbar and Footer were rewritten with Atlas chrome. Each of these layers was independently confirmed:
1. Source in `Navbar.tsx` + `Footer.tsx` ✅ (git diff showed new code)
2. Container running from rebuilt image (sha `bc5a9790`) ✅
3. Origin chunk had `bg-amber-50/95` (new code) ✅ — verified by hitting origin IP directly
4. CF edge chunk was 8.2 MB with old code ❌ — `cf-cache-status: HIT`, `age: 340982`

Layer 4 (CF) was the only failure point. Once purged, all 16 pages return 200 with Atlas design.

## Practical Implication
When someone reports "the old design is still showing" after a confirmed deploy:
1. Check `cf-cache-status` on the chunk URL — if `HIT`, purge CF first
2. If `MISS` but still wrong, wipe `.next/` on the host bind-mount and restart container
3. If correct in container but wrong on page, check `next.config.js` `remotePatterns` (may be blocking images from new hostnames)

## Related Concepts
- [[concepts/atlas-design-system]]
- [[concepts/docker-deployment]]
- [[concepts/cloudflare-caching-issue]]
- [[concepts/nextjs-image-config]]
- [[entities/nextjs]]

## Sources
- [[daily/2026-05-14.md]] — Full deploy cycle observed end-to-end; each caching layer independently confirmed
