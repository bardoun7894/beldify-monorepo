---
name: Service-Repository Pattern
description: Architectural pattern separating business logic from data access in Laravel
type: concept
sources: [sources/backend-claude]
created: 2026-05-08
updated: 2026-05-08
---

# Service-Repository Pattern

## Overview
An architectural pattern implemented in the Beldify Laravel backend that separates business logic from data access concerns.

## Key Points
- **Repositories** (`app/Repositories/`): Handle data access with caching capabilities
- **Services** (`app/Services/`): Contain business logic and orchestration
- **Controllers**: Invoke services, services use repositories
- Separation allows for easier testing and maintenance

## Key Services in Beldify
- `CacheService`: Redis-based caching with fallback strategies
- `StorageService`: Abstracted file storage (local/S3/Contabo)
- `NotificationService`: FCM push notifications
- `MessageService`: Real-time messaging between users
- `CommissionService`: Complex commission calculations

## Benefits
- Cleaner code organization
- Easier to mock data access in tests
- Centralized caching logic
- Abstracted storage operations

## See also
- [[sources/backend-claude]]
- [[entities/laravel]]
- [[entities/redis]]
- [[entities/storage-service]]