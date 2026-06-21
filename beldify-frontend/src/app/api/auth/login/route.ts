import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import logger from '@/utils/consoleLogger';
import { getCorsHeaders } from '@/utils/cors';
import { loginSchema, validateAndSanitize } from '@/utils/validation';
import { authRateLimit } from '@/middleware/rateLimit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * POST handler for user login.
 * Accepts { identifier, email?, password } where identifier is phone OR email.
 * Proxies to the Laravel backend.
 */
export async function POST(request: NextRequest) {
  return authRateLimit(request, async (request: NextRequest) => {
    try {
      const body = await request.json();

      // Validate and sanitize input
      const validation = validateAndSanitize(loginSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          {
            message: 'Validation failed',
            errors: validation.errors?.format(),
          },
          { status: 400 }
        );
      }

      const sanitizedData = validation.data!;

      // Get headers from the incoming request
      const contentType = request.headers.get('content-type');
      const acceptLanguage = request.headers.get('accept-language');
      const userAgent = request.headers.get('user-agent');
      const csrfToken = request.headers.get('x-csrf-token') || '';

      // Forward to Laravel backend. Send both `identifier` (new contract) and
      // `email` (backward-compat) so the backend handles either field.
      const payload = {
        identifier: sanitizedData.identifier,
        email: sanitizedData.email || sanitizedData.identifier,
        password: sanitizedData.password,
      };

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, payload, {
        headers: {
          'Content-Type': contentType || 'application/json',
          'Accept': 'application/json',
          'Accept-Language': acceptLanguage || 'en',
          'User-Agent': userAgent || 'Beldify-Frontend',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 30000,
      });

      logger.log('Login successful:', { identifier: sanitizedData.identifier });

      return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
      logger.error('Login error:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const errorData = error.response?.data || {
          message: 'Login failed',
          error: error.message,
        };
        return NextResponse.json(errorData, { status });
      }

      return NextResponse.json(
        {
          message: 'Internal server error during login',
          error: error.message || 'Unknown error',
        },
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
