import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generates a CSRF token and sets it as a cookie
 * This endpoint is used by the frontend to get a CSRF token for authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Generate a random token
    const csrfToken = crypto.randomBytes(32).toString('hex');
    
    // Get the current date/time
    const loggedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Create response with the token
    const response = NextResponse.json({
      status: 'success',
      message: 'CSRF cookie set successfully',
      csrf_token: csrfToken,
      logged_at: loggedAt
    });
    
    // Set the token as a cookie on the response
    response.cookies.set({
      name: 'XSRF-TOKEN',
      value: csrfToken,
      httpOnly: false, // Needs to be accessible from JS
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  } catch (error: any) {
    console.error('Error generating CSRF token:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to generate CSRF token' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({}, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}