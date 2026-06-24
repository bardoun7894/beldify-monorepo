---
name: Laravel Sanctum
description: Laravel package for API authentication and token management
type: entity
sources: [sources/backend-claude]
created: 2026-05-08
updated: 2026-05-08
---

# Laravel Sanctum

## What it is
Laravel's lightweight authentication package used for API token-based authentication in Beldify. Provides simple token management for mobile and SPA applications.

## Key facts
- Used for API authentication (not session-based)
- Tokens stored in personal_access_tokens table
- Scopes support for fine-grained permissions
- Works with Laravel's built-in authorization policies

## See also
- [[sources/backend-claude]]
- [[entities/laravel]]
- [[concepts/api-authentication]]