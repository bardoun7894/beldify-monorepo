---
name: Line Awesome CDN Version Mismatch (seller_shell)
description: seller_shell loaded Line Awesome 1.1.0 from a dead CDN causing blank KPI icons; fix was upgrading to 1.3.0 matching the admin layout
type: concept
tags: [php, blade, migration, request, css, html, cloudflare, volume, seller, auth]
sources: [daily/2026-05-31.md]
created: "2026-05-31"
updated: "2026-05-31"
---
# Line Awesome CDN Version Mismatch

## Overview
The Beldify seller shell (`seller_shell.blade.php`) loaded Line Awesome from `https://maxcdn.icons8.com/fonts/line-awesome/1.1.0/line-awesome.min.css` — a very old version from a CDN that is effectively dead for that path. Icons used in the seller dashboard KPI tiles (`la-wallet`, `la-box-open`, `la-shopping-bag`) do not exist in Line Awesome 1.1.0. The result: all icon elements render as blank pale squares instead of icon glyphs. The admin layout loads Line Awesome 1.3.0 and renders icons correctly.

## Key Points
- **Symptom**: blank pale square boxes where icon glyphs should appear (KPI tiles, nav icons, badge icons, section headers)
- **Root cause**: `la-wallet`, `la-box-open` and similar modern icons were added in Line Awesome versions after 1.1.0; they simply don't exist in the 1.1.0 font
- **Fix**: change the `<link>` in `seller_shell.blade.php` (and `auth/register-v3.blade.php` which uses the same old CDN) to the 1.3.0 URL that the admin layout already uses
- **Local font copy is also 1.1.0**: `public/admin/app-assets/fonts/line-awesome/` contains only the 1.1.0 local copy — it cannot serve as a fallback for missing icons
- **No visual error in browser console**: missing icon glyphs don't produce JS errors; they render as the font's fallback glyph (a blank space or replacement character), which can look like a styled empty container

## Details

### Before fix
```html
<!-- seller_shell.blade.php -->
<link rel="stylesheet" href="https://maxcdn.icons8.com/fonts/line-awesome/1.1.0/line-awesome.min.css">
```

### After fix
```html
<!-- seller_shell.blade.php + register-v3.blade.php -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/line-awesome/1.3.0/line-awesome.min.css">
```

This matches the CDN the admin layout uses, ensuring icon consistency across both surfaces.

### Detection
When icons render as blank boxes rather than glyphs:
1. Check DevTools Network tab for the icon font request — if it's a 404 or serving wrong content-type, the CDN is the problem
2. Inspect the CSS class: `la la-wallet` should map to a Unicode codepoint in the font; if the font version doesn't define that codepoint, the glyph is blank
3. Compare with a working surface — admin rendered icons correctly, confirming the font itself was fine and the version/URL was the issue

## Related Concepts
- [[concepts/seller-shell-layout]] — the seller shell layout where this fix was applied
- [[concepts/admin-atlas-migration]] — admin layout that was already on the correct 1.3.0 CDN
- [[concepts/beldify-local-volume-sync]] — sync required to push the fix into the local container

## Sources
- [[daily/2026-05-31.md]] — Blank KPI icons discovered during live browser verification of seller dashboard; root cause traced to LA 1.1.0 vs 1.3.0; fix applied to `seller_shell.blade.php` + `register-v3.blade.php`; verified in browser: all icons now render
