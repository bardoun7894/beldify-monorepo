import { NextResponse } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function GET() {
  try {
    // Check if we can connect to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://18.100.117.252';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const backendHealth = await fetch(`${backendUrl}/api/health`, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const backendStatus = await backendHealth.json();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      backend: backendStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || 'unknown',
      backendUrl,
      isProduction: !isDevelopment,
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
