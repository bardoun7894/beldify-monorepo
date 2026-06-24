# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Laravel 10 e-commerce platform (Beldify) with multi-seller support, tailoring services, and community features. The application uses a multi-frontend architecture with Laravel Blade for admin/seller dashboards and APIs for external Next.js frontend and mobile apps.

## Tech Stack

- **Backend**: Laravel 10, PHP 8.1+
- **Database**: MySQL with Redis caching
- **Authentication**: Laravel Sanctum for API authentication
- **Frontend**: Laravel Blade, Vue.js 3, Tailwind CSS with DaisyUI
- **Build Tools**: Vite for asset compilation
- **Storage**: Supports local, AWS S3, and Contabo storage
- **Notifications**: Firebase Cloud Messaging (FCM)

## Common Commands

### Development
```bash
# Start development server with hot reload
npm run dev

# Start Laravel development server
php artisan serve

# Watch and compile assets
npm run watch

# Build for production
npm run build
npm run production
```

### Database
```bash
# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Fresh migration with seeders
php artisan migrate:fresh --seed

# Create a new migration
php artisan make:migration create_table_name
```

### Testing
```bash
# Run all tests
php artisan test

# Run unit tests only
php artisan test --testsuite=Unit

# Run feature tests only
php artisan test --testsuite=Feature

# Run specific test file
php artisan test tests/Feature/ExampleTest.php

# Run with coverage
php artisan test --coverage
```

### Cache Management
```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Cache configuration and routes (production)
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Queue Management
```bash
# Process queue jobs
php artisan queue:work

# Process failed jobs
php artisan queue:retry all
```

## Architecture Overview

### Service-Repository Pattern
The application implements a Service-Repository pattern:
- **Repositories** (`app/Repositories/`): Handle data access with caching
- **Services** (`app/Services/`): Contain business logic
- **Controllers** invoke services, services use repositories

### Key Services
- `CacheService`: Redis-based caching with fallback strategies
- `StorageService`: Abstracted file storage (local/S3/Contabo)
- `NotificationService`: FCM push notifications
- `MessageService`: Real-time messaging between users
- `CommissionService`: Complex commission calculations

### API Structure
APIs are versioned and organized by domain:
- `/api/v1/*` - Main API endpoints
- `/api/mobile/v1/*` - Mobile-specific endpoints
- `/api/v1/community/*` - Community features
- `/api/backend/*` - Admin/seller dashboard APIs

### Model Organization
Models are organized by domain with clear relationships:
- E-commerce: Product, Order, Cart, Review
- Users: User, Customer, UserProfile
- Stores: Store, StoreProfile, Commission
- Tailoring: Tailor, TailoringOrder, Measurements
- Community: Message, CommunityPost, PostResponse

### Middleware Stack
Key middleware for request processing:
- `SetLocaleMiddleware`: Multi-language support
- `CheckStoreDetailsMiddleware`: Store ownership verification
- `CustomRoleMiddleware`: Role-based access control
- `CommunityApiCors`: CORS for community features

## Development Guidelines

### Follow Laravel Conventions
- Use Eloquent ORM over raw queries
- Implement Form Requests for validation
- Use resource controllers for CRUD operations
- Follow PSR-12 coding standards

### Caching Strategy
- Use `CacheService` for all caching operations
- Cache keys follow pattern: `{domain}:{entity}:{id}`
- Implement cache invalidation on updates

### File Storage
- Always use `StorageService` for file operations
- Never hardcode storage paths
- Handle multiple storage providers gracefully

### API Development
- Use API Resources for response transformation
- Implement proper error handling with consistent format
- Version APIs appropriately
- Document endpoints with clear request/response examples

### Database Practices
- Always use migrations for schema changes
- Implement proper indexes for query optimization
- Use database transactions for data integrity
- Follow naming conventions: snake_case for tables/columns

### Security Considerations
- Use Sanctum for API authentication
- Implement proper authorization with policies
- Validate all user inputs
- Never expose sensitive data in responses
- Use environment variables for configuration

## Environment Setup

Key environment variables to configure:
- Database: `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`
- Redis: `REDIS_HOST`, `REDIS_PORT`
- Storage: `FILESYSTEM_DRIVER`, AWS credentials if using S3
- Frontend: `FRONTEND_URL`, `NEXTJS_REVALIDATE_URL`
- FCM: `FCM_SERVER_KEY`, `FCM_PROJECT_ID`

## Important Files and Directories

- `app/Services/` - Business logic services
- `app/Repositories/` - Data access layer
- `app/Http/Controllers/API/` - API controllers
- `app/Models/` - Eloquent models
- `routes/api.php` - API route definitions
- `config/` - Application configuration
- `database/migrations/` - Database migrations
- `.env.example` - Environment configuration template