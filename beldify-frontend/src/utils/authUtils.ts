/**
 * Authentication utilities for API routes
 * This file was created to fix a build error in production mode
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from './consoleLogger';

/**
 * Get authentication token from localStorage (client-side) or cookies (server-side).
 * Server-side path reads the `token` cookie first (primary), then `auth_token` as fallback —
 * matching the cookie names set by AuthContext and /api/auth/set-cookie respectively.
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    // Client-side: get from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }

    // Server-side: read from request cookies via next/headers
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return (
      cookieStore.get('token')?.value ||
      cookieStore.get('auth_token')?.value ||
      null
    );
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