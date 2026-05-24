import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/utils/authUtils';
import logger from '@/utils/consoleLogger';

export async function GET(request: NextRequest) {
  try {
    logger.log('=== Auth Token Test Debug ===');
    
    // Check all possible token sources
    const authToken = await getAuthToken();
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    // Check localStorage simulation (this won't work server-side but good for debugging)
    const clientSideInfo = 'Server-side - cannot access localStorage';
    
    const debugInfo = {
      serverSideToken: authToken ? 'Present' : 'Missing',
      authorizationHeader: authHeader ? 'Present' : 'Missing',
      cookieHeader: cookieHeader ? 'Present' : 'Missing',
      clientSideInfo,
      timestamp: new Date().toISOString()
    };
    
    if (authToken) {
      debugInfo.serverSideToken = `Present (${authToken.substring(0, 20)}...)`;
    }
    
    if (authHeader) {
      debugInfo.authorizationHeader = `Present (${authHeader.substring(0, 30)}...)`;
    }
    
    logger.log('Token test debug info:', debugInfo);
    
    return NextResponse.json({
      success: true,
      authenticated: !!authToken,
      debugInfo
    });
    
  } catch (error) {
    logger.error('Error in token test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Token test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
