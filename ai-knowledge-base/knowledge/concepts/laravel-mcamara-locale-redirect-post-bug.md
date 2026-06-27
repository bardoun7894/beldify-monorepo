---
name: Laravel mcamara Locale-Redirect POST→GET 405 Bug
description: POSTing to a locale-less route triggers mcamara localeSessionRedirect → 302 → browser replays as GET → MethodNotAllowedHttpException (405) on POST-only routes; fix is GET links that swap the locale segment in the current URL
type: concept
tags: [laravel, php, blade, middleware, request, route, tinker, pattern, architecture, i18n]
sources: [daily/2026-06-02.md]
created: "2026-06-02"
updated: "2026-06-02"
---
# Laravel mcamara Locale-Redirect POST→GET 405 Bug

## Problem

Submitting a POST form to a route that has no locale prefix (`/change-language`) triggers the `mcamara/laravel-localization` middleware `localeSessionRedirect`. The middleware issues a **302 redirect** to the locale-prefixed equivalent (`/ar/change-language`). Browsers follow a 302 from a POST by replaying the request as a **GET**. If the target route is registered as POST-only, the rewritten GET request returns:

```
The GET method is not supported for route ar/change-language. Supported methods: POST.
```

HTTP 405 Method Not Allowed.

## Root cause chain

```
POST /change-language
  → mcamara localeSessionRedirect (web middleware group)
  → 302 Location: /ar/change-language
  → browser: GET /ar/change-language   ← RFC 7231 §6.4.3: 302 allows method change
  → Laravel: MethodNotAllowedHttpException (405)
```

This pattern hits any form that (a) submits to a locale-less path and (b) uses a POST-only route.

## Fix — use GET links that swap the locale segment

Replace the POST form with plain `<a>` links that construct the locale-prefixed URL client-side by swapping the first path segment:

```blade
{{-- Before: POST form (breaks with mcamara redirect) --}}
<form method="POST" action="/change-language">
    @csrf
    <input type="hidden" name="locale" value="{{ $lang }}">
    <button type="submit">{{ $label }}</button>
</form>

{{-- After: GET link that swaps locale segment in current URL --}}
@php
$segments = explode('/', ltrim(request()->getRequestUri(), '/'));
$segments[0] = $lang;
$newUrl = '/' . implode('/', $segments);
@endphp
<a href="{{ $newUrl }}">{{ $label }}</a>
```

The link constructs a full URL with the correct locale prefix in position 0. No form, no POST, no redirect chain — the browser GETs the right URL directly, and mcamara's session locale is updated by the middleware on that GET.

**Alternative**: Use `localized_route($name, [], $locale)` helper if routes have names, or `LaravelLocalization::getLocalizedURL($locale)` for the canonical mcamara approach.

## Where it happened in Beldify

- `seller_shell.blade.php` — language switcher (5 locale buttons: ar/en/fr/es/ma)
- `admin/includes/register-v3.blade.php` — same switcher pattern

Both were changed from POST forms to GET `<a>` links computing the swapped URL from `request()->getRequestUri()`.

The dead `POST /change-language` route was also removed from `routes/web.php`.

## Symptoms checklist

| Symptom | Cause |
|---------|-------|
| 405 only when submitting language switcher form | POST-only route + mcamara redirect |
| 405 only on routes without locale prefix | localeSessionRedirect not triggered on prefixed routes |
| Chrome Network: two requests (POST 302, GET 405) | Redirect chain playing out |
| Works in Laravel `tinker` / API client | Direct HTTP client follows redirects differently or skips web middleware |

## Related Concepts
- [[concepts/beldify-admin-locale-routing]] — locale prefix architecture and available_locales config
- [[concepts/i18n-t-fallback-vs-locale-value]] — locale value resolution after switch

## Sources
- [[daily/2026-06-02.md]] — Language switcher 405 in seller_shell + register-v3; POST form → GET link fix; dead /change-language route removed
