import { NextResponse } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function GET() {
  try {
    // Check if we can connect to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { status: 'unhealthy', timestamp: new Date().toISOString(), error: 'Backend URL not configured' },
        { status: 503 }
      );
    }
    const backendHealth = await fetch(`${backendUrl}/api/health`, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: isDevelopment ? 0 : 30 }, // No cache in dev, 30s cache in prod
    });
    const backendStatus = await backendHealth.json();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      backend: backendStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown',
      isProduction: !isDevelopment,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
        environment: process.env.NODE_ENV,
        isProduction: !isDevelopment,
      },
      { status: 503 }
    );
  }
}
