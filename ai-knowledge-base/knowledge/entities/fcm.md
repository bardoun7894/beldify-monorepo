---
name: Firebase Cloud Messaging
description: Push notification service used for mobile notifications in Beldify
type: entity
tags: [notification, fcm, integration]
sources: [sources/backend-claude]
created: "2026-05-08"
updated: "2026-05-08"
---
# Firebase Cloud Messaging (FCM)

## What it is
Google's cross-platform messaging solution used to send push notifications from the Beldify backend to mobile applications.

## Key facts
- Configured via FCM_SERVER_KEY and FCM_PROJECT_ID
- NotificationService handles FCM integration
- Supports both notification and data messages
- Handles device token management

## See also
- [[sources/backend-claude]]
- [[entities/beldify]]
- [[concepts/push-notifications]]