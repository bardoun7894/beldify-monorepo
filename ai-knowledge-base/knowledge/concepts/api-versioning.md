---
name: API Versioning
description: Strategy for managing API changes without breaking existing clients
type: concept
tags: [laravel, request, response, seller, service-repository, repository, pattern]
sources: [sources/backend-claude]
created: "2026-05-08"
updated: "2026-05-08"
---
# API Versioning

## Overview
The Beldify backend uses URL-based API versioning to manage changes and maintain backward compatibility across different client versions.

## Key Points
- Version included in URL path: `/api/v1/*`
- Separate paths for different client types
- API Resources transform responses consistently
- Proper error handling with consistent format

## API Endpoints in Beldify
| Path | Purpose |
|------|---------|
| `/api/v1/*` | Main API endpoints for Next.js frontend |
| `/api/mobile/v1/*` | Mobile-specific endpoints |
| `/api/v1/community/*` | Community features (messaging, posts) |
| `/api/backend/*` | Admin/seller dashboard APIs |

## Best Practices
- Version APIs appropriately before breaking changes
- Document endpoints with clear request/response examples
- Use API Resources for response transformation
- Implement consistent error handling

## See also
- [[sources/backend-claude]]
- [[concepts/service-repository-pattern]]
- [[entities/laravel]]