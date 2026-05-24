import { NextRequest } from 'next/server';
import { getCSRFToken } from '@/utils/csrf';

export async function GET(request: NextRequest) {
  return getCSRFToken(request);
}