---
name: Buyer–Seller Messaging Contract Fix
description: "Next.js proxy sent recipient_id but Laravel BuyerMessageController validated shop_id — every customer→seller send returned 422; conversation detail page [shopId]/page.tsx was also missing entirely"
type: concept
tags: [laravel, php, migration, event, listener, validation, request, response, route, css]
sources: [daily/2026-06-01.md, daily/2026-06-02.md]
created: "2026-06-01"
updated: "2026-06-02"
---
# Buyer–Seller Messaging Contract Fix

## Overview
The customer↔seller messaging feature had two independent bugs that together made it completely non-functional: every send returned a silent 422, and clicking any conversation thread in the inbox returned a 404. Both were frontend-side issues against a functioning Laravel backend.

## Bug 1 — `recipient_id` vs `shop_id` Field Name Mismatch

### Root Cause
The Next.js API proxy at `app/community/messages/send/route.ts` forwarded the field as `recipient_id`:
```ts
// WRONG
body: JSON.stringify({ recipient_id: shopId, message: content })
```

The Laravel `BuyerMessageController@sendMessage` validates with:
```php
$request->validate([
    'shop_id'  => 'required|exists:stores,id',
    'message'  => 'required|string|max:5000',
]);
```

Laravel's validator found no `shop_id` key → returned HTTP 422 Unprocessable Entity. The frontend showed no visible error (the response was swallowed), so every send silently failed.

### Fix — `app/community/messages/send/route.ts`
```ts
// CORRECT
body: JSON.stringify({ shop_id: shopId, message: content })
```

**Commit**: `fdd960e`

## Bug 2 — Missing Conversation Detail Page

### Root Cause
The inbox (`/community/messages`) listed all conversations but each row linked to `/community/messages/{shopId}`. This route had no corresponding Next.js page file — navigating to it returned a Next.js 404.

### Fix — `beldify-frontend/src/app/community/messages/[shopId]/page.tsx` (new)
The new page:
- Calls `getConversation(shopId)` on mount to load message history.
- Renders mine/theirs bubble layout (mine: right-aligned indigo, theirs: left-aligned parchment).
- Send form calls `sendMessage(shopId, content)` via the now-fixed proxy.
- Polls for new messages every 8 seconds (no WebSocket; matches existing inbox polling cadence).
- RTL-aware: uses `dir="auto"` on message bubbles; layout uses logical CSS.
- i18n: `useTranslations('messages')` with English fallbacks for all strings.

**Commit**: `ac1f9e4`

## Full Messaging Architecture (for reference)

```
Customer browser → Next.js /community/messages
  → GET  /api/messages/conversations  (BuyerMessageController@conversations)
  → lists shops the customer has messaged

Customer browser → Next.js /community/messages/{shopId}
  → GET  /api/messages/conversation/{shopId}  (BuyerMessageController@getConversation)
  → renders message history

Customer browser → send form
  → POST /community/messages/send (Next.js proxy)
  → POST /api/messages/send  { shop_id, message }  (BuyerMessageController@sendMessage)
  → creates Message record, notifies seller via FCM
```

## Diagnostic Pattern
When a form returns 422 with no visible frontend error:
1. Open Network tab, locate the failing POST.
2. Check the request payload keys against the backend validation rules.
3. Even a one-character field name mismatch (`recipient_id` vs `shop_id`) causes a hard 422.

When a Next.js route returns 404:
1. Check `app/<path>/page.tsx` exists for the dynamic segment.
2. `[shopId]` maps to `/messages/123` — if the file is missing, any click on a conversation 404s regardless of the API.

## Realtime additions (2026-06-02)

After the contract fix landed, full WebSocket realtime was wired in the same day.

### Backend — MessageSent broadcast

`broadcast(new MessageSent($message))->toOthers()` added to both:
- `BuyerMessageController@sendMessage`
- `SellerMessageController@sendMessage`

Channel: `private-user.{recipient_id}`, event: `message-sent`. The `MessageSent` event uses `$message->sender->display_name` (not `name` — see [[concepts/laravel-user-display-name-accessor]]).

### Frontend — Echo listener in conversation page

`/community/messages/[shopId]/page.tsx` wired to `useRealtimeChat()`:
- Subscribes to `private-user.{currentUserId}` on mount, unsubscribes on unmount
- `onMessageReceived` deduplicates by message ID (prevents doubles from poll + push)
- Optimistic send: appends the message immediately client-side while the API call is in-flight
- Fallback polling: 8s (visible tab) / 20s (background tab) as safety net if WebSocket drops

### cURL scheme bug (required for backend broadcast to work)

`config/broadcasting.php` was passing `REVERB_SCHEME=ws` directly to the Pusher HTTP API client, causing `cURL error 1: Protocol "ws" not supported`. Fixed by deriving `http`/`https` from the WS scheme. See [[concepts/laravel-reverb-broadcasting-scheme-config]] for full details.

### Verification

Full soketi round-trip verified (commit `6f43bdb9` backend, `e8613ff` frontend):
- soketi running on port 6001
- Backend accepts publish request → soketi shows "ACCEPTED"
- `pusher-js` browser subscription receives `message-sent` event payload

## Related Concepts
- [[concepts/laravel-reverb-broadcasting-scheme-config]] — WS scheme bug in broadcasting config + soketi setup for L10
- [[concepts/atlas-frontend-migration]] — Context for the Next.js frontend architecture and API proxy pattern
- [[concepts/seller-shell-layout]] — Seller-side messaging tab that this feature backs
- [[concepts/open-souk-feature]] — Community feature that sits alongside messaging in the seller shell

## Sources
- [[daily/2026-06-01.md]] — Session 25023e79: `recipient_id`→`shop_id` field fix (commit fdd960e); new conversation detail page `/community/messages/[shopId]/page.tsx` (commit ac1f9e4)
- [[daily/2026-06-02.md]] — MessageSent broadcast wired to both controllers; config/broadcasting.php scheme fix; Echo listener + dedup + optimistic send + fallback polling in conversation page; soketi round-trip verified (commit 6f43bdb9 + e8613ff)
