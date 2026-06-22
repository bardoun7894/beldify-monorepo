import { NextRequest, NextResponse } from 'next/server';
import logger from '@/utils/consoleLogger';

// Security check for metrics access
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const token = process.env.CACHE_METRICS_TOKEN || process.env.CACHE_CLEAR_TOKEN;
  
  if (!token) {
    logger.warn('No CACHE_METRICS_TOKEN or CACHE_CLEAR_TOKEN configured');
    return false;
  }
  
  return authHeader === `Bearer ${token}`;
}

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized access to cache metrics' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const detailed = searchParams.get('detailed') === 'true';

    // Basic health status
    const healthStatus = {
      isHealthy: true,
      redisAvailable: false,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      totalOperations: 0,
      hitRate: 0
    };
    
    const summary = {
      totalKeys: 0,
      totalHits: 0,
      totalMisses: 0,
      totalSets: 0,
      totalDeletes: 0,
      totalErrors: 0,
      totalOperations: 0,
      hitRate: 0
    };

    const response = {
      timestamp: new Date().toISOString(),
      health: healthStatus,
      summary,
      topKeys: [],
      errorKeys: [],
      message: 'Basic cache metrics - advanced metrics disabled'
    };

    // Return different formats
    if (format === 'prometheus') {
      // Basic Prometheus metrics format
      const prometheusMetrics = [
        `# HELP process_uptime_seconds Process uptime in seconds`,
        `# TYPE process_uptime_seconds gauge`,
        `process_uptime_seconds ${healthStatus.uptime}`,
        ``,
        `# HELP nodejs_memory_usage_bytes Node.js memory usage`,
        `# TYPE nodejs_memory_usage_bytes gauge`,
        `nodejs_memory_usage_bytes{type="rss"} ${healthStatus.memoryUsage.rss}`,
        `nodejs_memory_usage_bytes{type="heapTotal"} ${healthStatus.memoryUsage.heapTotal}`,
        `nodejs_memory_usage_bytes{type="heapUsed"} ${healthStatus.memoryUsage.heapUsed}`,
        `nodejs_memory_usage_bytes{type="external"} ${healthStatus.memoryUsage.external}`,
        ''
      ].join('\n');
      
      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    logger.error('Cache metrics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve cache metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Cache-Health': 'healthy',
        'X-Redis-Available': 'false',
        'X-Hit-Rate': '0',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}