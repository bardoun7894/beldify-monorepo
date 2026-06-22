import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import logger from '@/utils/consoleLogger';

/**
 * Debug-only endpoint. Disabled in production to avoid leaking token fragments
 * (the reviewer flagged this as a P1 security issue: previous implementation
 * returned the first 20 chars of the auth token and 30 chars of the
 * Authorization header in the JSON response with no auth guard).
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    logger.log('=== Auth Token Test Debug ===');

    const authToken = await getAuthToken();
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // Presence-only — never echo token bytes in the response, even in dev
    const debugInfo = {
      serverSideToken: authToken ? 'Present' : 'Missing',
      authorizationHeader: authHeader ? 'Present' : 'Missing',
      cookieHeader: cookieHeader ? 'Present' : 'Missing',
      timestamp: new Date().toISOString(),
    };

    logger.log('Token test debug info:', debugInfo);

    return NextResponse.json({
      success: true,
      authenticated: !!authToken,
      debugInfo,
    });
  } catch (error) {
    logger.error('Error in token test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Token test failed',
      },
      { status: 500 },
    );
  }
}
