---
name: Docker BuildKit COPY-layer cache hazard
description: "BuildKit can false-hit the `COPY . .` layer cache after a single-file change lands in the build context — the fresh-looking image silently ships old code; verify an in-image content marker before deploying, and force --no-cache when stale"
type: concept
tags: [docker, deploy, ci, shipping, cache]
sources: [sources/2026-06-11-prod-console-errors-fix]
created: "2026-06-11"
updated: "2026-06-11"
---
# Docker BuildKit COPY-layer cache hazard

A multi-stage image rebuild can produce a brand-new image tag, take full build time, and still ship code compiled from a **stale build context snapshot**. On 2026-06-11 the Beldify frontend image was rebuilt minutes after a changed `src/app/sw.ts` was scp'd into the live tree (mtime, size, and md5 all verified server-side before the build) — yet the resulting image's `public/sw.js` was compiled from the old source. BuildKit had reused the `COPY . .` layer (and everything after it) from a build made earlier the same evening.

The trap is that nothing looks cached from the outside: the image ID is new, `docker images` shows "x minutes ago", and the build log streams for minutes (the deps stage re-ran `npm ci`). The only reliable check is a **content marker inside the image**, compared against the expected value from a known-good local build of the same source. For the Beldify SW fix the marker was the occurrence count of the string `cross-origin` in `public/sw.js`: 2 in the old code (defaultCache definition) vs 3 with the fix (an extra comparison literal in the filter). One read-only command settles it:

```bash
docker run --rm --entrypoint sh <image> -c 'grep -o cross-origin public/sw.js | wc -l'
```

Operating rules that follow:

1. After shipping a single-file change into an image build, **verify the marker inside the image before recreating the container** — never trust tag freshness or build duration.
2. If the marker is stale, force `docker compose build --no-cache <service>` and re-verify, then `up -d <service>` separately. Splitting build from up also avoids the second failure mode hit the same night: an SSH drop killed `compose up -d --build` between image-tag and container-recreate, leaving the container running the older image.
3. Long server-side builds must not depend on the SSH session: `nohup … > /tmp/build.log 2>&1 < /dev/null &`, then poll the log for terminal markers (`naming to` / `failed to solve`).

## See also
- [[concepts/serwist-service-worker-pitfalls]] — the SW fix whose deploy exposed this hazard
- [[sources/2026-06-11-prod-console-errors-fix]]
- [[entities/beldify]]
