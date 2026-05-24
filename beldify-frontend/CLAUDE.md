# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beldify is a Next.js 15 e-commerce frontend application specializing in Moroccan traditional fashion. It features multilingual support (i18n), PWA capabilities, real-time messaging, and comprehensive security measures. This repository contains only the frontend code - the backend API is hosted on a separate server.

## Development Commands

### Primary Development
```bash
npm run dev              # Standard development server on port 3000
npm run dev:fast         # Turbo mode with memory optimization
npm run dev:debug        # Debug mode with Turbo
npm run docker:dev       # Docker development environment
```

### Build & Production
```bash
npm run build:dev        # Development build
npm run build:prod       # Production build (no lint)
npm run start:dev        # Start dev build on port 3001
npm run start:prod       # Start production on port 7894
```

### Code Quality
```bash
npm run lint             # Run ESLint
```

Note: No test scripts are currently configured. Consider implementing tests.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context API
- **Frontend API Routes**: Next.js `/api` routes for proxying and middleware
- **Backend API**: External Laravel server (configured via NEXT_PUBLIC_API_URL)
- **Authentication**: NextAuth with Google OAuth
- **Real-time**: Firebase FCM for notifications, WebSocket for messaging
- **PWA**: Service Worker with next-pwa

### Directory Structure
```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── api/         # API endpoints
│   └── [pages]/     # Application pages
├── components/       # Reusable React components
├── contexts/        # React Context providers
├── services/        # API service layer
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── middleware/      # Express-style middleware
├── i18n/            # Internationalization
└── types/           # TypeScript type definitions
```

### Key Contexts
- `AuthContext`: User authentication state
- `CartContext`: Shopping cart management
- `WishlistContext`: User wishlist
- `MessagingContext`: Real-time messaging
- `EnhancedPWAContext`: PWA installation and features

### API Services Pattern
Services in `src/services/` follow a consistent pattern:
- `axiosInstance.ts` provides configured HTTP client with backend URL
- Individual service files export typed API methods
- Mock services available for development
- All backend API calls go through `NEXT_PUBLIC_API_URL` environment variable
- Frontend `/api` routes handle authentication, CSRF, rate limiting, and caching

### Security Implementation
- **CSRF Protection**: Token-based via `/api/csrf-token`
- **Rate Limiting**: Configurable per endpoint
- **Input Validation**: Zod schemas in `utils/validation.ts`
- **XSS Protection**: DOMPurify in `utils/sanitizeHtml.ts`
- **CORS**: Configured in `utils/cors.ts`

## Environment Configuration

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_API_URL`: Backend Laravel API server URL
- Google OAuth credentials
- Firebase/FCM configuration
- WebSocket settings
- Security tokens (CSRF, cache clear)
- Rate limiting parameters

## Security Considerations

1. **Never commit secrets** - All sensitive data in environment variables
2. **Sanitize user input** - Use validation schemas and DOMPurify
3. **Apply rate limiting** - Especially on auth endpoints
4. **Use CSRF tokens** - For state-changing operations
5. **Secure cookies** - httpOnly, secure, sameSite strict

## Development Workflow

1. **Before making changes**: Check existing patterns in similar files
2. **Use existing utilities**: Prefer existing services and utilities over creating new ones
3. **Follow conventions**: Match existing code style and patterns
4. **Validate changes**: Run `npm run lint` before committing
5. **Test thoroughly**: Verify changes work with both dev and production builds

## Important Notes

- This is a frontend-only repository - backend API is hosted separately
- PWA features require HTTPS in production
- WebSocket fallback to polling if connection fails
- Multiple Next.js config files for different environments
- Docker available for consistent development environment
- Rate limiting uses in-memory store (consider Redis for production)
- Backend API endpoints are accessed via `NEXT_PUBLIC_API_URL`
- Frontend `/api` routes act as middleware layer for backend communication