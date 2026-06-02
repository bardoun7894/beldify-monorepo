---
name: MySQL
description: Relational database used by Beldify backend
type: entity
sources: [sources/backend-claude]
created: 2026-05-08
updated: 2026-05-08
---

# MySQL

## What it is
Relational database management system used as the primary data store for the Beldify Laravel backend.

## Key facts
- Used for storing all e-commerce data: products, orders, users, stores
- Connection configured via DB_CONNECTION, DB_HOST, DB_DATABASE
- Follows snake_case naming convention for tables and columns
- Migrations managed through Laravel's migration system

## See also
- [[sources/backend-claude]]
- [[entities/laravel]]
- [[entities/beldify]]