---
name: Laravel Broadcasting WebSocket Scheme Configuration
description: "config/broadcasting.php must derive http/https from the WS scheme (ws→http, wss→https) for the server-side Pusher HTTP client; passing REVERB_SCHEME=ws directly causes cURL \"Protocol ws disabled\"; Laravel 10 requires an external WS server (soketi), not laravel/reverb which requires L11"
type: concept
tags: [laravel, php, event, request, seller, buyer, auth]
sources: [daily/2026-06-02.md]
created: "2026-06-02"
updated: "2026-06-02"
---
# Laravel Broadcasting WebSocket Scheme Configuration

## Problem

Setting `REVERB_SCHEME=ws` in `.env` and using that value directly in `config/broadcasting.php` for the server-side Pusher HTTP API client causes:

```
cURL error 1: Protocol "ws" not supported or disabled in libcurl
```

The WS/WSS schemes are for browser WebSocket connections. The server-side Pusher HTTP API client (`pusher/pusher-php-server`) communicates over **HTTP/HTTPS**, not WebSocket.

## Root cause

`config/broadcasting.php` Reverb driver config before fix:

```php
// BROKEN — passes 'ws' or 'wss' to the Pusher HTTP API client
'options' => [
    'scheme' => env('REVERB_SCHEME', 'http'),
    // ...
],
```

When `REVERB_SCHEME=ws` (typical for local dev), the Pusher PHP library builds a cURL request to `ws://localhost:8080/apps/...`, which libcurl rejects.

## Fix — derive HTTP scheme from WS scheme

```php
// config/broadcasting.php
'reverb' => [
    'driver'  => 'pusher',
    'key'     => env('REVERB_APP_KEY'),
    'secret'  => env('REVERB_APP_SECRET'),
    'app_id'  => env('REVERB_APP_ID'),
    'options' => [
        // Derive HTTP/HTTPS from the WS/WSS scheme — never pass 'ws' to cURL
        'scheme'   => env('REVERB_SCHEME', 'ws') === 'wss' ? 'https' : 'http',
        'host'     => env('REVERB_HOST', '127.0.0.1'),
        'port'     => env('REVERB_PORT', 8080),
        'useTLS'   => env('REVERB_SCHEME', 'ws') === 'wss',
        'encrypted' => env('REVERB_SCHEME', 'ws') === 'wss',
    ],
    'client_options' => [],
],
```

The browser-side `PUSHER_SCHEME` / `NEXT_PUBLIC_REVERB_SCHEME` env vars remain `ws`/`wss` unchanged — only the server-side config does the conversion.

## Laravel 10 vs Laravel 11 — soketi, not reverb

`laravel/reverb` (the first-party WebSocket server) requires **Laravel 11**. Beldify backend runs **Laravel 10**. The supported WebSocket server for L10 is **soketi** (or Pusher itself), which implements the Pusher protocol.

### Local dev setup with soketi

```bash
# Install soketi globally
npm install -g @soketi/soketi

# Run soketi on the default Pusher port
soketi --config='{"host":"0.0.0.0","port":6001,"appManager.array.apps":[{"id":"beldify-local","key":"beldify-key","secret":"beldify-secret","enableClientMessages":false,"enableStatistics":false}]}'
```

`.env` values that match:
```
BROADCAST_DRIVER=pusher
REVERB_APP_ID=beldify-local
REVERB_APP_KEY=beldify-key
REVERB_APP_SECRET=beldify-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=6001
REVERB_SCHEME=ws
```

## Frontend — forceTLS from scheme

In `RealtimeChatContext.tsx`, derive `forceTLS` from the scheme env var rather than hardcoding:

```ts
const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'ws';
const echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 6001),
    forceTLS: scheme === 'wss',
    disableStats: true,
    cluster: '',
    enabledTransports: ['ws', 'wss'],
});
```

Never hardcode `forceTLS: false` — it breaks production WSS.

## Realtime messaging verification (Beldify 2026-06-02)

End-to-end verification sequence:
1. soketi running locally on port 6001
2. `broadcast(new MessageSent($message))->toOthers()` added to `BuyerMessageController@sendMessage` and `SellerMessageController@sendMessage`
3. `config/broadcasting.php` scheme fix applied
4. `pusher-js` loaded in browser console:

```js
const p = new Pusher('beldify-key', {
  wsHost: '127.0.0.1', wsPort: 6001, forceTLS: false,
  disableStats: true, cluster: '',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: 'http://localhost:8002/broadcasting/auth',
  auth: { headers: { 'X-XSRF-TOKEN': '<token>' } }
});
p.subscribe('private-user.2').bind('message-sent', (d) => console.log(d));
```

5. Trigger a message send → soketi console shows "ACCEPTED" → browser devtools logs event payload

**Result**: Full round-trip confirmed — backend publishes to channel, frontend receives via WebSocket.

## Channel naming

Private channels use `private-user.{recipient_id}`. The `MessageSent` event:

```php
class MessageSent implements ShouldBroadcast
{
    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.' . $this->message->recipient_id)];
    }

    public function broadcastAs(): string
    {
        return 'message-sent';
    }
}
```

Frontend subscription:
```ts
echo.private(`user.${currentUserId}`)
    .listen('.message-sent', (data) => { /* handle */ });
```

Note the `.` prefix in `.listen()` — Laravel auto-prepends the app namespace unless `broadcastAs()` is defined with a leading `.`.

## Related Concepts
- [[concepts/buyer-seller-messaging-contract-fix]] — frontend API contract for messaging (static polling + realtime)
- [[concepts/laravel-user-display-name-accessor]] — MessageSent uses display_name (name column is always null)

## Sources
- [[daily/2026-06-02.md]] — cURL "Protocol ws disabled" diagnosed; config/broadcasting.php scheme derivation fix; soketi verified; full round-trip confirmed (commit 6f43bdb9 backend, e8613ff frontend)
