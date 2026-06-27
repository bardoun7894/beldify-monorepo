---
name: Beldify Backend CLAUDE.md
description: "Laravel 10 backend with multi-seller e-commerce, tailoring, and community features"
type: source
tags: [laravel, php, middleware, mysql, redis, seller, cart, order, product, firebase]
sources: [raw/backend-claude.md]
created: "2026-05-08"
updated: "2026-05-08"
---
# Beldify Backend CLAUDE.md

## Summary
Detailed backend documentation for the Beldify Laravel 10 e-commerce platform. Covers tech stack, architecture patterns, API structure, middleware, and development guidelines for a multi-seller marketplace with tailoring services and community features.

## Key points
- Laravel 10 with PHP 8.1+, MySQL database, Redis caching
- Authentication via Laravel Sanctum
- Service-Repository pattern: CacheService, StorageService, NotificationService, MessageService, CommissionService
- API versions: /api/v1/*, /api/mobile/v1/*, /api/v1/community/*, /api/backend/*
- Models: Product, Order, Cart, Review, User, Store, Tailor, TailoringOrder, Message, CommunityPost
- Middleware: SetLocaleMiddleware, CheckStoreDetailsMiddleware, CustomRoleMiddleware
- Storage: local, AWS S3, Contabo; Notifications: Firebase Cloud Messaging

## See also
- [[entities/beldify]]
- [[entities/laravel]]
- [[entities/mysql]]
- [[entities/redis]]
- [[concepts/service-repository-pattern]]
- [[concepts/api-versioning]]
- [[concepts/multi-seller-ecommerce]]