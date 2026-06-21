/**
 * Authentication utilities for API routes
 * This file was created to fix a build error in production mode
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from './consoleLogger';

/**
 * Get authentication token from request cookies/headers (server-side) or localStorage (client-side).
 * Pass the NextRequest when calling from an API route so the token is read from
 * the incoming request rather than from localStorage (which is unavailable server-side).
 */
export const getAuthToken = async (request?: NextRequest): Promise<string | null> => {
  try {
    // Server-side with request: read from cookies then Authorization header
    if (request) {
      const fromCookie =
        request.cookies.get('token')?.value ||
        request.cookies.get('auth_token')?.value;
      if (fromCookie) return fromCookie;
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
      return null;
    }

    // Client-side: read from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }

    // Server-side without request: cannot determine token
    return null;
  } catch (error) {
    logger.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Verify if a request is authenticated
 */
export const verifyAuth = async (req: NextRequest) => {
  try {
    // Get auth token from request headers
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    
    if (!token) {
      return {
        isAuthenticated: false,
        error: 'No authentication token provided'
      };
    }
    
    // In a real implementation, you would validate the token
    // This is a placeholder implementation
    return {
      isAuthenticated: true,
      userId: 'placeholder-user-id'
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: 'Authentication failed'
    };
  }
};

/**
 * Handle unauthorized responses
 */
export const unauthorized = () => {
  return NextResponse.json(
    { status: 'error', message: 'Unauthorized' },
    { status: 401 }
  );
};

/**
 * Extract user ID from authenticated request
 */
export const getUserId = async (req: NextRequest) => {
  const auth = await verifyAuth(req);
  
  if (!auth.isAuthenticated) {
    return null;
  }
  
  return auth.userId;
}; 