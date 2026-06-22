/**
 * Next.js API proxy: POST /api/buyer-ai/assistant
 *
 * Forwards to Laravel: POST ${BACKEND_URL}/api/buyer-ai/assistant
 *
 * Why a proxy?
 *   - Keeps CSRF/session cookie flow in a server-to-server hop (avoids CORS)
 *   - Centralises rate-limit middleware on the Laravel side
 *   - The client service hits '/api/buyer-ai/assistant' (relative), not the
 *     backend origin directly, matching the project's service-layer-proxy pattern
 *
 * Status pass-through: 200, 422 (validation), 429 (throttle) are forwarded verbatim.
 * Any 5xx from the backend is also forwarded so the client shows the right error.
 */
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/utils/consoleLogger';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://pro.beldify.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward Accept-Language so the backend serves the right locale
    const acceptLanguage = request.headers.get('accept-language') || 'ma';

    // Forward session cookies (CSRF + Laravel session) from the browser request
    const cookieHeader = request.headers.get('cookie') || '';

    const backendRes = await fetch(`${BACKEND_URL}/api/buyer-ai/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Language': acceptLanguage,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    // Parse backend response (always JSON per contract)
    const data = await backendRes.json().catch(() => ({
      reply: 'Service temporarily unavailable.',
      products: [],
      suggestions: [],
    }));

    // Pass through status: 200, 422, 429 — let the client handle them
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    logger.error('[assistant proxy] Error forwarding to backend:', error);
    return NextResponse.json(
      {
        reply: 'Service temporarily unavailable. Please try again.',
        products: [],
        suggestions: [],
      },
      { status: 503 }
    );
  }
}
