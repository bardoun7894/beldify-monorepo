---
name: Laravel
description: PHP framework for building web applications and APIs
type: entity
tags: [laravel, php, artisan, nextjs, mysql, redis, sanctum]
sources: [sources/beldify-claude]
created: "2026-05-08"
updated: "2026-05-08"
---
# Laravel

## What it is
PHP framework used for the Beldify backend API and admin dashboards. Version 10 is used in this project.

## Key facts
- Version: Laravel 10, PHP 8.1+
- Database: MySQL with Redis caching
- Authentication: Laravel Sanctum
- Backend code in `beldify-backend/app/`
- Routes in `beldify-backend/routes/`
- Dev server: `php artisan serve`
- Tests: `php artisan test`

## See also
- [[sources/beldify-claude]]
- [[entities/beldify]]
- [[entities/nextjs]]
- [[concepts/php]]
- [[concepts/laravel-services]]