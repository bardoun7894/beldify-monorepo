# Admin Messaging Oversight

## Overview
A read-only admin view of **every** buyer↔store conversation across the platform.
Admins (roles `admin` / `super-admin`) can browse threads for moderation/support but
do **not** participate — nothing in this view marks messages as read, so sellers'
own unread counts are never altered.

This complements the seller messaging UI (`seller.messages.*`), which is scoped to a
single seller's own store conversations.

## Routes
| Method | URI | Name | Purpose |
|--------|-----|------|---------|
| GET | `admin/messages` | `admin.messages.index` | List all conversations (grouped by store + buyer), newest activity first. Supports `?q=` search over store name, buyer name/email, and message body. |
| GET | `admin/messages/{storeId}/{buyerId}` | `admin.messages.show` | Full thread for one store↔buyer pair (oldest first). |

Both routes inherit the admin group guard from `routes/admin.php`
(`auth`, `verified`, `role:super-admin`).

## Components
- **Controller**: `App\Http\Controllers\Admin\MessageController` (`index`, `show`).
- **Service**: `App\Services\MessageService`
  - `getAllConversations(): Collection` — platform-wide, grouped by `(store_id, buyer)`.
  - `getAdminConversationThread(int $storeId, int $buyerId): array` — one thread, read-only.
- **Views**: `resources/views/admin/messages/{index,show}.blade.php` (v3 component library).
- **Header**: `admin/includes/header-v3.blade.php` shows a messages icon for admins
  linking to `admin.messages.index`, badged with the platform-wide unread buyer-message count.

## Notes
- A conversation's "buyer" is the party whose `sender_type` is `buyer`; when the seller
  sent the latest message the buyer is resolved from `recipient_id`.
- `unread_count` counts buyer-sent messages with `is_read = false` (i.e. awaiting a seller reply).

## Related
- [seller-dashboard.md](../api/seller-dashboard.md)
