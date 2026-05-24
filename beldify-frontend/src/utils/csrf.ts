import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Generates a CSRF token
 */
export function generateCSRFToken(): string {
  const randomToken = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${randomToken}.${timestamp}`;
  const signature = createHash('sha256').update(payload + CSRF_SECRET).digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Validates a CSRF token
 */
export function validateCSRFToken(token: string, maxAge: number = 3600000): boolean { // 1 hour default
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [randomPart, timestampPart, signature] = parts;
    const payload = `${randomPart}.${timestampPart}`;
    const expectedSignature = createHash('sha256').update(payload + CSRF_SECRET).digest('hex');
    
    // Verify signature
    if (signature !== expectedSignature) return false;
    
    // Check token age
    const timestamp = parseInt(timestampPart);
    const now = Date.now();
    if (now - timestamp > maxAge) return false;
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sets CSRF token in cookie and returns it
 */
export function setCSRFCookie(response: NextResponse): string {
  const token = generateCSRFToken();
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600, // 1 hour
  });
  
  return token;
}

/**
 * Validates CSRF token from request
 */
export function validateCSRFFromRequest(request: NextRequest): boolean {
  // Get token from header or body
  const headerToken = request.headers.get('X-CSRF-Token') || 
                     request.headers.get('X-Requested-With');
  
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  if (!headerToken || !cookieToken) {
    return false;
  }
  
  // Both tokens should be valid and match
  return validateCSRFToken(headerToken) && 
         validateCSRFToken(cookieToken) && 
         headerToken === cookieToken;
}

/**
 * CSRF middleware wrapper
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: { 
    skipMethods?: string[],
    skipPaths?: string[],
  } = {}
) {
  const { skipMethods = ['GET', 'HEAD', 'OPTIONS'], skipPaths = [] } = options;
  
  return async function(request: NextRequest): Promise<NextResponse> {
    const method = request.method;
    const pathname = request.nextUrl.pathname;
    
    // Skip CSRF check for safe methods or specific paths
    if (skipMethods.includes(method) || skipPaths.some(path => pathname.startsWith(path))) {
      return handler(request);
    }
    
    // Validate CSRF token
    if (!validateCSRFFromRequest(request)) {
      return NextResponse.json(
        { 
          error: 'Invalid CSRF token',
          message: 'CSRF token validation failed. Please refresh and try again.'
        },
        { status: 403 }
      );
    }
    
    return handler(request);
  };
}

/**
 * API route to get CSRF token
 */
export async function getCSRFToken(request: NextRequest): Promise<NextResponse> {
  const token = generateCSRFToken();
  const response = NextResponse.json({ csrfToken: token });
  
  // Set token in cookie
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600, // 1 hour
  });
  
  return response;
}