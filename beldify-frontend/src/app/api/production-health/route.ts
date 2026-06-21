import { NextResponse } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';

export const viewport = {
  themeColor: '#4F46E5',
};

export async function GET() {
  try {
    // Check if we can connect to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const backendHealth = await fetch(`${backendUrl}/api/health`, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: isDevelopment ? 0 : 30 }, // No cache in dev, 30s cache in prod
    });
    const backendStatus = await backendHealth.json();

    // Get Redis status if available
    let redisStatus = { connected: false };
    if (process.env.REDIS_URL) {
      try {
        const redisCheck = await fetch('/api/cache/status', {
          next: { revalidate: 0 }, // Always fresh
        });
        redisStatus = await redisCheck.json();
      } catch (redisError) {
        redisStatus = { 
          connected: false, 
          error: redisError instanceof Error ? redisError.message : 'Unknown Redis error' 
        };
      }
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      backend: backendStatus,
      redis: redisStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown',
      isProduction: !isDevelopment,
      hasRedis: !!process.env.REDIS_URL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV,
        isProduction: !isDevelopment,
      },
      { status: 503 }
    );
  }
}