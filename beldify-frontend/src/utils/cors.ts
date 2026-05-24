import { NextRequest, NextResponse } from 'next/server';

// Define allowed origins - update these based on your environment
const getAllowedOrigins = () => {
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://www.beldify.com',
    'https://beldify.com',
  ];
  
  // Add development origins only in development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:3001');
  }
  
  return origins.filter(Boolean);
};

export function corsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Check if the origin is allowed
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  const headers = new Headers();
  
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400');
  
  return headers;
}

export function handleCors(request: NextRequest, response: NextResponse) {
  const corsHeaders = getCorsHeaders(request);
  
  // Apply CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  const headers: Record<string, string> = {};
  
  // Only set origin if it's in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-Token';
  headers['Access-Control-Allow-Credentials'] = 'true';
  headers['Access-Control-Max-Age'] = '86400';
  
  return headers;
}

export function createCorsResponse(request: NextRequest, status: number = 200) {
  const response = NextResponse.json({}, { status });
  const headers = getCorsHeaders(request);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}