import { NextRequest, NextResponse } from 'next/server';
import { clearAllCache } from '../../cache';
import { strictRateLimit } from '@/middleware/rateLimit';
import { withCSRFProtection } from '@/utils/csrf';
import logger from '@/utils/consoleLogger';

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to clear cache',
    timestamp: new Date().toISOString(),
    endpoints: {
      clear: 'POST /api/cache/clear',
      metrics: 'GET /api/cache/metrics',
      warming: 'GET|POST /api/cache/warming'
    }
  });
}

export async function POST(request: NextRequest) {
  // Apply strict rate limiting and CSRF protection
  return strictRateLimit(request, withCSRFProtection(async (request: NextRequest) => {
  try {
    // Enhanced security checks
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CACHE_CLEAR_TOKEN;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    request.ip || 'unknown';
    
    // Log the attempt
    logger.log(`Cache clear attempt from IP: ${clientIp}`);

    if (!expectedToken) {
      logger.error('CACHE_CLEAR_TOKEN environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      logger.warn(`Unauthorized cache clear attempt from IP: ${clientIp}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Additional security: Check if request is from allowed IPs (optional)
    const allowedIPs = process.env.CACHE_CLEAR_ALLOWED_IPS?.split(',') || [];
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIp)) {
      logger.warn(`Cache clear attempt from disallowed IP: ${clientIp}`);
      return NextResponse.json(
        { error: 'IP not allowed' },
        { status: 403 }
      );
    }

    // Clear all caches
    const result = await clearAllCache();
    const message = result ? 'Cache cleared successfully' : 'Failed to clear cache';
    
    if (!result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to clear cache',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message,
      cleared: 'all',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Cache clear error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
  }));
}