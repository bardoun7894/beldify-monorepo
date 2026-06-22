import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import logger from '@/utils/consoleLogger';

/**
 * Generates a CSRF token and sets it as a cookie
 * This endpoint is used by the frontend to get a CSRF token for authentication
 */
const ALLOWED_ORIGINS = [
  'https://www.beldify.com',
  'https://beldify.com',
  'https://pro.beldify.com',
  'http://localhost:3110',
  'http://localhost:3000',
];

function resolveOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Default to the canonical production origin so credentialed requests are never paired with '*'
  return ALLOWED_ORIGINS[0];
}

function applyCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Vary', 'Origin');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
}

export async function GET(request: NextRequest) {
  try {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const loggedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const response = NextResponse.json({
      status: 'success',
      message: 'CSRF cookie set successfully',
      csrf_token: csrfToken,
      logged_at: loggedAt,
    });

    response.cookies.set({
      name: 'XSRF-TOKEN',
      value: csrfToken,
      httpOnly: false,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    applyCorsHeaders(response, resolveOrigin(request));
    return response;
  } catch (error: any) {
    logger.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to generate CSRF token' },
      { status: 500 },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({}, { status: 200 });
  applyCorsHeaders(response, resolveOrigin(request));
  return response;
}
