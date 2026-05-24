import { NextRequest, NextResponse } from 'next/server';
import logger from '@/utils/consoleLogger';
import { getCorsHeaders } from '@/utils/cors';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Create response
    const response = NextResponse.json({ success: true });
    
    // Set httpOnly cookie for server-side authentication ONLY
    // This prevents XSS attacks from accessing the token
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed from 'lax' to 'strict' for better security
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    // DO NOT set a non-httpOnly cookie - this is a security vulnerability
    // The token should only be accessible server-side

    logger.log('Authentication cookies set successfully');
    return response;
    
  } catch (error) {
    logger.error('Error setting auth cookies:', error);
    return NextResponse.json(
      { error: 'Failed to set authentication cookies' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({}, { status: 200 });
  const corsHeaders = getCorsHeaders(request);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export async function DELETE(request: NextRequest) {
  try {
    // Create response with CORS headers
    const response = NextResponse.json({ success: true });
    
    // Clear authentication cookies
    response.cookies.delete('auth_token');
    // Remove deletion of non-httpOnly token as we no longer set it
    
    // Set proper CORS headers
    const corsHeaders = getCorsHeaders(request);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    logger.log('Authentication cookies cleared successfully');
    return response;
    
  } catch (error) {
    logger.error('Error clearing auth cookies:', error);
    return NextResponse.json(
      { error: 'Failed to clear authentication cookies' },
      { status: 500 }
    );
  }
}
