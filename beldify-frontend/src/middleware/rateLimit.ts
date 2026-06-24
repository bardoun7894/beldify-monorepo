import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function createRateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    keyGenerator = (request: NextRequest) => getClientId(request),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async function rateLimit(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(request);
    const now = Date.now();
    const resetTime = now + windowMs;

    // Initialize or get existing record
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = { count: 0, resetTime };
    }

    const record = rateLimitStore[key];

    // Check if rate limit exceeded
    if (record.count >= maxRequests) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString(),
            'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
          },
        }
      );
    }

    // Increment counter before processing request
    record.count++;

    try {
      // Process the request
      const response = await handler(request);

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
      response.headers.set('X-RateLimit-Reset', record.resetTime.toString());

      // Skip counting if configured
      if (skipSuccessfulRequests && response.status < 400) {
        record.count--;
      } else if (skipFailedRequests && response.status >= 400) {
        record.count--;
      }

      return response;
    } catch (error) {
      // Decrement on error if configured
      if (skipFailedRequests) {
        record.count--;
      }
      throw error;
    }
  };
}

// Get client identifier for rate limiting
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  const ip = forwardedFor?.split(',')[0] ||
             realIp ||
             cfConnectingIp ||
             'unknown';

  // For authenticated requests, we could also use user ID
  // const userId = getUserIdFromRequest(request);
  // return userId ? `user:${userId}` : `ip:${ip}`;

  return `ip:${ip}`;
}

// Specific rate limiters for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes for auth endpoints
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes for general API
});

export const strictRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute for sensitive endpoints
});