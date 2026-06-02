---
name: Beldify
description: Multi-seller e-commerce platform with tailoring services and community features
type: entity
sources: [sources/beldify-claude]
created: 2026-05-08
updated: 2026-05-08
---

# Beldify

## What it is
Multi-seller e-commerce platform with support for tailoring services and community features. Built as a monorepo with separate frontend and backend applications.

## Key facts
- Architecture: Monorepo with frontend and backend
- Frontend: Next.js 15 application
- Backend: Laravel 10 API and admin dashboards
- Uses Laravel Sanctum for API authentication
- Multi-language support via SetLocaleMiddleware
- Supports local, AWS S3, and Contabo storage

## See also
- [[sources/beldify-claude]]
- [[entities/nextjs]]
- [[entities/laravel]]
- [[concepts/monorepo]]