import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generates a CSRF token and sets it as a cookie
 * This endpoint is used by the frontend to get a CSRF token for form submissions
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
      maxAge: 60 * 60 * 24, // 1 day
    });
    
    return response;
  } catch (error) {
    console.error('Error setting CSRF cookie:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to set CSRF cookie' },
      { status: 500 }
    );
  }
}
