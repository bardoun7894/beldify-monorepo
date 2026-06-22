import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import logger from '@/utils/consoleLogger';
import { getCorsHeaders } from '@/utils/cors';
import { registrationSchema, validateAndSanitize } from '@/utils/validation';
import { authRateLimit } from '@/middleware/rateLimit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * POST handler for user registration
 * Proxies the request to the Laravel backend
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  return authRateLimit(request, async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // Validate and sanitize input
    const validation = validateAndSanitize(registrationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: validation.errors?.format()
        },
        { status: 400 }
      );
    }
    
    const sanitizedData = validation.data!;
    
    // Get headers from the incoming request
    const contentType = request.headers.get('content-type');
    const acceptLanguage = request.headers.get('accept-language');
    const userAgent = request.headers.get('user-agent');
    
    // Make request to Laravel backend with sanitized data
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, sanitizedData, {
      headers: {
        'Content-Type': contentType || 'application/json',
        'Accept': 'application/json',
        'Accept-Language': acceptLanguage || 'en',
        'User-Agent': userAgent || 'Beldify-Frontend',
      },
      timeout: 30000, // 30 second timeout
    });
    
    logger.log('Registration successful:', { phone: (sanitizedData as any).phone, email: (sanitizedData as any).email });
    
    // Return the response from the backend
    return NextResponse.json(response.data, { status: response.status });
    
  } catch (error: any) {
    logger.error('Registration error:', error);
    
    if (axios.isAxiosError(error)) {
      // Forward the error response from the backend
      const status = error.response?.status || 500;
      const errorData = error.response?.data || { message: 'Registration failed' };
      
      return NextResponse.json(errorData, { status });
    }
    
    // Handle non-axios errors
    return NextResponse.json(
      { message: 'Internal server error during registration' },
      { status: 500 }
    );
  }
  });
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({}, { status: 200 });
  const corsHeaders = getCorsHeaders(request);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}